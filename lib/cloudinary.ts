import { v2 as cloudinary } from "cloudinary";

let configured = false;

function getCloudinary() {
  if (!configured) {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const parsedUrl = cloudinaryUrl ? new URL(cloudinaryUrl) : null;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || parsedUrl?.hostname,
      api_key: process.env.CLOUDINARY_API_KEY || decodeURIComponent(parsedUrl?.username || ""),
      api_secret: process.env.CLOUDINARY_API_SECRET || decodeURIComponent(parsedUrl?.password || ""),
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export async function uploadProductImage(dataUri: string) {
  return getCloudinary().uploader.upload(dataUri, { folder: "emt/products", resource_type: "image" });
}

export async function deleteProductImage(publicId: string) {
  if (!publicId) return;
  await getCloudinary().uploader.destroy(publicId, { resource_type: "image" });
}
