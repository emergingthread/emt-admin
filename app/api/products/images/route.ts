import { NextResponse } from "next/server";
import { getAuthenticatedUser, isAuthResponse } from "@/lib/auth";
import { uploadProductImage } from "@/lib/cloudinary";

/**
 * @swagger
 * /api/products/images:
 *   post:
 *     tags: [Products]
 *     summary: Upload a product image to Cloudinary
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dataUri]
 *             properties:
 *               dataUri: { type: string, description: Base64 image data URI }
 *     responses:
 *       200: { description: Cloudinary URL and public ID returned }
 *       400: { description: Invalid image }
 */

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (isAuthResponse(auth)) return auth;
  try {
    const body = await request.json() as { dataUri?: string };
    if (!body.dataUri?.startsWith("data:image/")) return NextResponse.json({ message: "A valid image is required" }, { status: 400 });
    const match = body.dataUri.match(/^data:image\/(jpeg|png|webp|gif);base64,/);
    if (!match || Buffer.byteLength(body.dataUri, "utf8") > 5 * 1024 * 1024) return NextResponse.json({ message: "Use a JPG, PNG, WEBP, or GIF image under 5 MB" }, { status: 400 });
    const result = await uploadProductImage(body.dataUri);
    return NextResponse.json({ imageUrl: result.secure_url, url: result.secure_url, publicId: result.public_id });
  } catch {
    return NextResponse.json({ message: "Unable to upload image" }, { status: 500 });
  }
}
