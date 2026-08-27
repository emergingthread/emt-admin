import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export default function ApiDocPage() {
  return <ReactSwagger spec={getApiDocs()} />;
}