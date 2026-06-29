import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Complaint from "@/lib/models/Complaint";

async function getStationId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

// PATCH /api/complaints/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const stationId = await getStationId();
  if (!stationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !["open", "resolved"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await connectDB();

  const updateData: { status: string; resolvedAt?: Date | null } = { status };
  if (status === "resolved") {
    updateData.resolvedAt = new Date();
  } else {
    updateData.resolvedAt = null;
  }

  const complaint = await Complaint.findOneAndUpdate(
    { _id: id, stationId },
    updateData,
    { new: true }
  );

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  return NextResponse.json({ complaint });
}
