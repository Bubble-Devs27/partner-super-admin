import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Service from "@/lib/models/Service";
import Order from "@/lib/models/Order";
import Complaint from "@/lib/models/Complaint";
import mongoose from "mongoose";

// POST /api/seed  — only call once to populate demo data
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stationId = new mongoose.Types.ObjectId(payload.userId);

  await connectDB();

  // Clear existing
  await Service.deleteMany({ stationId });
  await Order.deleteMany({ stationId });
  await Complaint.deleteMany({ stationId });

  // Seed Services
  const serviceData = [
    { name: "Full Body Wash", description: "Complete exterior wash with foam, rinse, and dry.", price: 299, duration: 30, category: "Washing", isVisible: true },
    { name: "Interior Cleaning", description: "Vacuuming, seat cleaning, dashboard wipe.", price: 499, duration: 45, category: "Cleaning", isVisible: true },
    { name: "Engine Wash", description: "High-pressure engine bay degreasing.", price: 699, duration: 60, category: "Washing", isVisible: true },
    { name: "Foam Wash + Wax", description: "Luxury foam wash with carnauba wax coating.", price: 799, duration: 50, category: "Washing", isVisible: true },
    { name: "Tyre Shine", description: "Tyre dressing and rim polishing.", price: 149, duration: 15, category: "Detailing", isVisible: true },
    { name: "Headlight Restoration", description: "Polishing cloudy headlights for better visibility.", price: 399, duration: 30, category: "Detailing", isVisible: false },
    { name: "Paint Protection Film", description: "Premium PPF application on hood and fenders.", price: 2499, duration: 120, category: "Protection", isVisible: true },
    { name: "AC Cleaning", description: "AC vent cleaning and anti-bacterial treatment.", price: 349, duration: 40, category: "Cleaning", isVisible: true },
  ];

  const services = await Service.insertMany(
    serviceData.map((s) => ({ ...s, stationId }))
  );

  // Seed Orders — spread over past 30 days
  const statusOptions: Array<"pending" | "in_progress" | "completed" | "cancelled"> = [
    "completed", "completed", "completed", "pending", "in_progress", "cancelled",
  ];
  const customers = [
    { customerName: "Rahul Sharma", customerPhone: "9876543210", vehicleNumber: "DL3CAB1234" },
    { customerName: "Priya Singh", customerPhone: "9123456789", vehicleNumber: "MH12DE4321" },
    { customerName: "Amit Patel", customerPhone: "9988776655", vehicleNumber: "KA03MN7890" },
    { customerName: "Sneha Gupta", customerPhone: "8877665544", vehicleNumber: "TN09AP2345" },
    { customerName: "Vikram Rao", customerPhone: "7766554433", vehicleNumber: "GJ01BC5678" },
    { customerName: "Neha Joshi", customerPhone: "6655443322", vehicleNumber: "UP32CD9012" },
    { customerName: "Karan Mehta", customerPhone: "9543210987", vehicleNumber: "RJ14EF3456" },
    { customerName: "Anjali Das", customerPhone: "8432109876", vehicleNumber: "WB06GH7890" },
  ];

  const orderDocs = [];
  const now = Date.now();
  for (let i = 0; i < 60; i++) {
    const service = services[Math.floor(Math.random() * services.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

    orderDocs.push({
      stationId,
      serviceId: service._id,
      serviceName: service.name,
      ...customer,
      status,
      amount: service.price,
      createdAt,
      updatedAt: createdAt,
    });
  }
  await Order.insertMany(orderDocs);

  // Seed Complaints
  const complaintData = [
    { customerName: "Rahul Sharma", customerPhone: "9876543210", subject: "Water marks on hood", description: "After the full body wash, there are visible water marks on the hood. Please fix.", status: "open" },
    { customerName: "Priya Singh", customerPhone: "9123456789", subject: "Interior still dusty", description: "The dashboard was not wiped properly. Dust is still visible on the A/C vents.", status: "resolved" },
    { customerName: "Amit Patel", customerPhone: "9988776655", subject: "Long wait time", description: "Waited over 90 minutes for a 30-minute wash. Please improve scheduling.", status: "open" },
    { customerName: "Vikram Rao", customerPhone: "7766554433", subject: "Scratched alloy rim", description: "Found a scratch on my rear-left alloy rim after the tyre shine service.", status: "open" },
    { customerName: "Neha Joshi", customerPhone: "6655443322", subject: "Billing issue", description: "Was charged for engine wash but I only booked a basic wash.", status: "resolved" },
    { customerName: "Karan Mehta", customerPhone: "9543210987", subject: "Staff was rude", description: "The attendant was dismissive when I asked about service progress.", status: "open" },
  ];

  const daysAgoList = [0, 5, 3, 1, 12, 2];
  await Complaint.insertMany(
    complaintData.map((c, i) => {
      const createdAt = new Date(now - daysAgoList[i] * 24 * 60 * 60 * 1000);
      return {
        ...c,
        stationId,
        resolvedAt: c.status === "resolved" ? createdAt : undefined,
        createdAt,
        updatedAt: createdAt,
      };
    })
  );

  return NextResponse.json({ message: "Seed data created successfully" });
}
