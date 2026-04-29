type CloudinaryResourceType = "image" | "video";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: CloudinaryResourceType;
  durationSeconds?: number;
}

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

const ensureCloudinaryConfig = () => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured");
  }
};

const sha1Hex = async (value: string) => {
  const { createHash } = await import("node:crypto");
  return createHash("sha1").update(value).digest("hex");
};

export const uploadBase64ToCloudinary = async (
  dataUri: string,
  resourceType: CloudinaryResourceType,
  folder: string
): Promise<CloudinaryUploadResult> => {
  ensureCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = await sha1Hex(paramsToSign);
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const body = new URLSearchParams({
    file: dataUri,
    api_key: CLOUDINARY_API_KEY,
    timestamp: String(timestamp),
    folder,
    signature,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(String(payload.error ?? "Cloudinary upload failed"));
  }

  const secureUrl = String(payload.secure_url ?? "");
  const publicId = String(payload.public_id ?? "");
  const duration = Number(payload.duration ?? 0);

  if (!secureUrl || !publicId) {
    throw new Error("Invalid Cloudinary response");
  }

  return {
    url: secureUrl,
    publicId,
    resourceType,
    durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : undefined,
  };
};
