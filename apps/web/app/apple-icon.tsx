import { ImageResponse } from "next/og";
import { AppIconVisual } from "./app-icon-visual";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconVisual size={size.width} />, size);
}
