import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { AssetList } from "./components/AssetList";
import { AssetForm } from "./components/AssetForm";
import { Inventories } from "./components/Inventories";
import { InventoryDetail } from "./components/InventoryDetail";
import { StockList } from "./components/StockList";
import { Login } from "./components/Login";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "assets", Component: AssetList },
      { path: "assets/new", Component: AssetForm },
      { path: "assets/:id/edit", Component: AssetForm },
      { path: "inventories", Component: Inventories },
      { path: "inventories/:id", Component: InventoryDetail },
      { path: "stock", Component: StockList },
    ],
  },
]);
