import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    experienceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experience",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seats: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Seats must be an integer",
      },
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

bookingSchema.index({ userId: 1, experienceId: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;

