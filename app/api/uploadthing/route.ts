import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "@/lib/uploadthing";

// Expose the file router sebagai GET + POST endpoint
export const { GET, POST } = createRouteHandler({ router: uploadRouter });
