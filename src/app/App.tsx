import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { AssetProvider } from "./store/assetContext";
import { AuthProvider } from "./store/authContext";

export default function App() {
  return (
    <AuthProvider>
      <AssetProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" richColors />
      </AssetProvider>
    </AuthProvider>
  );
}
