import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Complaint from "@/lib/models/Complaint";
import mongoose from "mongoose";

async function getStationId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

// GET /api/complaints?status=all|open|resolved
export async function GET(req: NextRequest) {
  const stationId = await getStationId();
  if (!stationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "all";

  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { stationId: new mongoose.Types.ObjectId(stationId) };
  if (status !== "all") {
    filter.status = status;
  }

  const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).limit(200);

  const [openCount, resolvedCount] = await Promise.all([
    Complaint.countDocuments({
      stationId: new mongoose.Types.ObjectId(stationId),
      status: "open",
    }),
    Complaint.countDocuments({
      stationId: new mongoose.Types.ObjectId(stationId),
      status: "resolved",
    }),
  ]);

  return NextResponse.json({ complaints, openCount, resolvedCount });
}
