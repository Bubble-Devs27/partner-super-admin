import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import mongoose from "mongoose";

async function getStationId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

// GET /api/orders?status=all|pending|completed&period=all|day|week|month
export async function GET(req: NextRequest) {
  const stationId = await getStationId();
  if (!stationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "all";
  const period = searchParams.get("period") ?? "all";

  await connectDB();

  // Build filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { stationId: new mongoose.Types.ObjectId(stationId) };

  if (status !== "all") {
    if (status === "completed") {
      filter.status = "completed";
    } else if (status === "pending") {
      filter.status = { $in: ["pending", "in_progress"] };
    } else {
      filter.status = status;
    }
  }

  if (period !== "all") {
    const now = new Date();
    let startDate: Date;
    if (period === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    filter.createdAt = { $gte: startDate };
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);

  // Summary counts (always for this station, no date filter)
  const [pendingCount, completedCount] = await Promise.all([
    Order.countDocuments({
      stationId: new mongoose.Types.ObjectId(stationId),
      status: { $in: ["pending", "in_progress"] },
    }),
    Order.countDocuments({
      stationId: new mongoose.Types.ObjectId(stationId),
      status: "completed",
    }),
  ]);

  return NextResponse.json({ orders, pendingCount, completedCount });
}
