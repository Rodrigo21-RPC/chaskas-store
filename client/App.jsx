import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { CatalogPage } from "./pages/CatalogPage.jsx";
import { ProductDetailPage } from "./pages/ProductDetailPage.jsx";
import { StoreLayout } from "./components/StoreLayout.jsx";
import { OrderProvider, useOrder } from "./order/OrderProvider.jsx";
import { OrderPage } from "./pages/OrderPage.jsx";
import { Feedback } from "./components/Feedback.jsx";
import { AdminLayout } from "./components/AdminLayout.jsx";
import { AdminGuard } from "./components/AdminGuard.jsx";
import { AdminLoginPage } from "./pages/AdminLoginPage.jsx";
import { AdminPanelPage } from "./pages/AdminPanelPage.jsx";
import { NewProductPage } from "./pages/NewProductPage.jsx";
function StoreRoutes() {
  const o = useOrder();
  const { pathname } = useLocation();
  return (
    <StoreLayout count={o.count}>
      {o.notice && pathname !== "/mi-pedido" && (
        <div className="global-notice">
          <Feedback message={o.notice} />
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={<CatalogPage onAdd={o.add} adding={o.adding} />}
        />
        <Route
          path="/productos/:id"
          element={<ProductDetailPage onAdd={o.add} adding={o.adding} />}
        />
        <Route path="/mi-pedido" element={<OrderPage />} />
        <Route
          path="*"
          element={
            <>
              <h1>Página no encontrada</h1>
              <Link to="/">Volver al catálogo</Link>
            </>
          }
        />
      </Routes>
    </StoreLayout>
  );
}
function AppRoutes() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin"))
    return (
      <AdminLayout>
        <Routes>
          <Route path="/admin/acceso" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminPanelPage />
              </AdminGuard>
            }
          />
          <Route
            path="/admin/productos/nuevo"
            element={
              <AdminGuard>
                <NewProductPage />
              </AdminGuard>
            }
          />
          <Route
            path="*"
            element={
              <>
                <h1>Página no encontrada</h1>
                <Link to="/">Volver al catálogo</Link>
              </>
            }
          />
        </Routes>
      </AdminLayout>
    );
  return <StoreRoutes />;
}
export function App() {
  return (
    <OrderProvider>
      <AppRoutes />
    </OrderProvider>
  );
}
