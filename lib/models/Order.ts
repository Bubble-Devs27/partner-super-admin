import mongoose, { Schema, Document, Model } from "mongoose";

export type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  stationId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  vehicleNumber: string;
  status: OrderStatus;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    stationId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
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
    vehicleNumber: {
      type: String,
      required: [true, "Vehicle number is required"],
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
  },
  { timestamps: true }
);

// Index for revenue aggregation queries
OrderSchema.index({ stationId: 1, createdAt: -1 });
OrderSchema.index({ stationId: 1, status: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
