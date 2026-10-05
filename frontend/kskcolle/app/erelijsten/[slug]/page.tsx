"use client"

import { useParams } from "next/navigation"
import ErelijstView from "../components/ErelijstView"

export default function ErelijstDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  return <ErelijstView slug={slug} />
}
