import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Phone, MessageSquare, Star, Droplet, Award, Hash, Flag, X, CheckCircle2,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { initials, formatDate, eligibleToDonate } from "../lib/bloodUtils";
import BloodGroupBadge from "../components/BloodGroupBadge";
import PulseMark from "../components/PulseMark";

const COMPLAINT_TYPES = [
  "Did not show up",
  "Asked for money unfairly",
  "Fake blood group or details",
  "Rude or abusive behavior",
  "Other",
];

export default function DonorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);

  const [complainOpen, setComplainOpen] = useState(false);
  const [complaintType, setComplaintType] = useState(COMPLAINT_TYPES[0]);
  const [description, setDescription] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageMime, setImageMime] = useState("");
  const [imageError, setImageError] = useState("");
  const [readingImage, setReadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.donors
      .get(id)
      .then(({ donor: d }) => !cancelled && setDonor(d))
      .catch(() => !cancelled && setDonor(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const resetComplaintForm = () => {
    setComplaintType(COMPLAINT_TYPES[0]);
    setDescription("");
    setImageName("");
    setImageData("");
    setImageMime("");
    setImageError("");
  };

  const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image is too large. Please choose one under 4MB.");
      return;
    }
    setImageError("");
    setReadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      const [, base64] = reader.result.split(",");
      setImageName(file.name);
      setImageData(base64);
      setImageMime(file.type);
      setReadingImage(false);
    };
    reader.onerror = () => {
      setImageError("Couldn't read that image, please try again.");
      setReadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!imageData) {
      setImageError("A proof image is required.");
      return;
    }
    setImageError("");
    setSubmitting(true);
    try {
      await api.complaints.create({
        donorId: donor.id,
        type: complaintType,
        description,
        imageName,
        imageData,
        imageMime,
      });
      setSubmitted(true);
      resetComplaintForm();
      setTimeout(() => {
        setSubmitted(false);
        setComplainOpen(false);
      }, 1800);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <PulseMark size={48} ring />
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="text-center py-24">
        <p className="text-crimson-900/50">Donor not found.</p>
        <button onClick={() => navigate("/donors")} className="mt-4 text-crimson-700 font-semibold">
          Back to donors
        </button>
      </div>
    );
  }

  const { eligible, daysLeft } = eligibleToDonate(donor.lastDonationDate);
  const isOwnProfile = donor.userId === user.id;

  return (
    <div className="max-w-3xl">
      <Link to="/donors" className="inline-flex items-center gap-2 text-sm font-semibold text-crimson-700 mb-6">
        <ArrowLeft size={16} /> Back to donors
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl gradient-brand p-8 text-white relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10 animate-drift" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center text-2xl font-bold">
            {initials(donor.fullName)}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{donor.fullName}</h1>
            <span className="inline-flex items-center gap-1 font-mono text-xs bg-white/15 px-2 py-0.5 rounded-md mt-1">
              <Hash size={11} /> {donor.donorCode}
            </span>
            <p className="text-white/70 text-sm flex items-center gap-1 mt-2">
              <MapPin size={14} /> {donor.address ? `${donor.address}, ` : ""}{donor.division}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <BloodGroupBadge group={donor.bloodGroup} />
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  donor.available ? "bg-emerald-400/20 text-emerald-100" : "bg-white/10 text-white/60"
                }`}
              >
                {donor.available ? "Available now" : "Unavailable"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-crimson-100 p-5 text-center">
          <Droplet className="mx-auto text-crimson-600" size={20} />
          <p className="text-xl font-display font-bold text-crimson-950 mt-2">{donor.totalDonations}</p>
          <p className="text-xs text-crimson-900/50">Total donations</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-crimson-100 p-5 text-center">
          <Star className="mx-auto text-amber-500" size={20} />
          <p className="text-xl font-display font-bold text-crimson-950 mt-2">{donor.rating || "—"}</p>
          <p className="text-xs text-crimson-900/50">Community rating</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-crimson-100 p-5 text-center">
          <Award className="mx-auto text-crimson-600" size={20} />
          <p className="text-xl font-display font-bold text-crimson-950 mt-2">
            {eligible ? "Eligible" : `${daysLeft}d`}
          </p>
          <p className="text-xs text-crimson-900/50">
            {eligible ? "Ready to donate" : "Until next eligible"}
          </p>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-crimson-100 p-6 mt-6">
        <h2 className="font-display font-semibold text-crimson-950 mb-3">About</h2>
        <p className="text-sm text-crimson-900/70 leading-relaxed">
          {donor.about || "This donor hasn't added a bio yet."}
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-crimson-100">
          <div className="flex items-center gap-2 text-sm text-crimson-900/70">
            <Phone size={14} className="text-crimson-500" /> {donor.phone || "Not shared"}
          </div>
          <div className="flex items-center gap-2 text-sm text-crimson-900/70">
            Last donation: {donor.lastDonationDate ? formatDate(donor.lastDonationDate) : "No record"}
          </div>
        </div>
      </motion.div>

      <div className="flex gap-3 mt-6">
        <Link
          to="/messages"
          state={{ withId: donor.id }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <MessageSquare size={16} /> Message {donor.fullName.split(" ")[0]}
        </Link>
        <Link
          to="/compatibility"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-crimson-200 text-crimson-700 font-semibold hover:bg-crimson-50 transition-colors"
        >
          Check compatibility
        </Link>
      </div>

      {!isOwnProfile && (
        <button
          onClick={() => setComplainOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-crimson-900/40 hover:text-red-600 transition-colors"
        >
          <Flag size={12} /> Report a problem with this donor
        </button>
      )}

      <AnimatePresence>
        {complainOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => !submitting && setComplainOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md"
            >
              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                  <p className="mt-3 font-semibold text-crimson-950">Complaint submitted</p>
                  <p className="text-sm text-crimson-900/50 mt-1">
                    Our admin team will review it. Thank you for keeping GivePulse safe.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-display font-bold text-crimson-950 flex items-center gap-2">
                      <Flag size={16} className="text-red-500" /> Report {donor.fullName.split(" ")[0]}
                    </h2>
                    <button onClick={() => setComplainOpen(false)} className="p-2 rounded-full hover:bg-crimson-50 text-crimson-700">
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-crimson-900/50 mb-5">
                    Complaints are only visible to GivePulse admins. If verified, the donor can be
                    blacklisted or have their account removed.
                  </p>
                  <form onSubmit={handleSubmitComplaint} className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-crimson-950">Type of complaint</label>
                      <select
                        value={complaintType}
                        onChange={(e) => setComplaintType(e.target.value)}
                        className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                      >
                        {COMPLAINT_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-crimson-950">What happened?</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Describe what happened..."
                        className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-crimson-200 text-sm focus-ring"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-crimson-950">
                        Proof image <span className="text-red-500">*</span>
                      </label>
                      <label className={`mt-1.5 flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed text-sm cursor-pointer hover:bg-crimson-50 transition-colors ${
                        imageError ? "border-red-400" : "border-crimson-300"
                      }`}>
                        <span className="px-3 py-1 rounded-lg bg-crimson-100 text-crimson-700 font-medium text-xs">Choose file</span>
                        <span className="text-crimson-900/40 truncate">
                          {readingImage ? "Reading…" : imageName || "No file chosen"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                      {imageError && <p className="text-xs text-red-600 mt-1.5">{imageError}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      {submitting ? "Submitting…" : "Submit complaint"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

