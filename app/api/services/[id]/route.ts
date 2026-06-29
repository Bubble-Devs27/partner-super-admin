import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Service from "@/lib/models/Service";

async function getStationId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

// PATCH /api/services/[id]
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

  await connectDB();

  const service = await Service.findOne({ _id: id, stationId });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const allowedFields = ["name", "description", "price", "duration", "category", "isVisible"];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any)[field] = body[field];
    }
  }

  await service.save();
  return NextResponse.json({ service });
}

// DELETE /api/services/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const stationId = await getStationId();
  if (!stationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();

  const service = await Service.findOneAndDelete({ _id: id, stationId });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Service deleted" });
}
