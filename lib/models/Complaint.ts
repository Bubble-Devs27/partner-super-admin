import mongoose, { Schema, Document, Model } from "mongoose";

export type ComplaintStatus = "open" | "resolved";

export interface IComplaint extends Document {
  _id: mongoose.Types.ObjectId;
  stationId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    stationId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
    resolvedAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

ComplaintSchema.index({ stationId: 1, status: 1 });

const Complaint: Model<IComplaint> =
  mongoose.models.Complaint ||
  mongoose.model<IComplaint>("Complaint", ComplaintSchema);

export default Complaint;
