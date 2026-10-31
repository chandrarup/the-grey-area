"use client";
import dynamic from "next/dynamic";
const Lab = dynamic(() => import("./lab"), { ssr: false });
export default function LabEntry() {
  return <Lab />;
}
