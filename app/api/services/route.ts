import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Service from "@/lib/models/Service";
import mongoose from "mongoose";

async function getStationId(req: NextRequest): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

// GET /api/services
export async function GET(req: NextRequest) {
  const stationId = await getStationId(req);
  if (!stationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const services = await Service.find({ stationId }).sort({ createdAt: -1 });
  return NextResponse.json({ services });
}

// POST /api/services
export async function POST(req: NextRequest) {
  const stationId = await getStationId(req);
  if (!stationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, price, duration, category, isVisible } = body;

  if (!name || price === undefined) {
    return NextResponse.json(
      { error: "Name and price are required" },
      { status: 400 }
    );
  }

  await connectDB();

  const service = await Service.create({
    stationId: new mongoose.Types.ObjectId(stationId),
    name,
    description: description ?? "",
    price: Number(price),
    duration: Number(duration ?? 30),
    category: category ?? "General",
    isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
  });

  return NextResponse.json({ service }, { status: 201 });
}
