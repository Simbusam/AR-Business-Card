import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import UserNavbar from "./layouts/navBar/userNav";
import AdminNavbar from "./layouts/navBar/adminNav";
import Navbar from "./layouts/navbar";
import Footer from "./layouts/footer";
import Register from "./pages/register";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import AdminDashboard from "./pages/adminDashboard";
import Pricing from "./pages/pricing";
import Project from "./pages/project";
import HomePage from "./pages/homepage";
import ProjectEditorNavbar from "./layouts/navBar/porjectEditor";
import ProjectEditor from "./pages/projectEditor";
import BusinessCardVideo from "./pages/BusinessCardVideo";
import BusinessCardDesign from "./pages/BusinessCardDesign";

function App() {
  const location = useLocation();

  // Define routes where Navbar and Footer should not be displayed
  const hideNavbarFooterRoutes = ["/register", "/login"];
  const adminRoutes = ["/admindash"];
  const dashboardRoutes = ["/dashboard"];
  const projectEditorRoutes = ["/project/projectEditor"];
  const normalRoutes = [];

  const shouldShowNavbarFooter = !hideNavbarFooterRoutes.includes(location.pathname);
  const isAdminRoute = adminRoutes.some(route => location.pathname.startsWith(route));
  const isDashboardRoute = dashboardRoutes.some(route => location.pathname.startsWith(route));
  const isProjectEditorRoute = projectEditorRoutes.some(route => location.pathname.startsWith(route));
  const isNormalRoute = normalRoutes.some(route => location.pathname.startsWith(route));

  // Select the appropriate navbar component
  let NavbarComponent = Navbar; // Default navbar for visitors
  if (isAdminRoute) {
    NavbarComponent = AdminNavbar;
  } else if (isDashboardRoute) {
    NavbarComponent = UserNavbar;
  } else if (isProjectEditorRoute) {
    NavbarComponent = ProjectEditorNavbar;
  } else if (isNormalRoute) {
    NavbarComponent = Navbar;
  }

  // Special case for homepage - don't show regular navbar/footer
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Conditionally render Navbar - not on homepage and not on project editor */}
      {shouldShowNavbarFooter && !isHomePage && !isProjectEditorRoute && <NavbarComponent />}

      {/* Main content area */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admindash" element={<AdminDashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/project" element={<Project />} />
          <Route path="/project/projectEditor/:projectId" element={<ProjectEditor />} />
          <Route path="/business-card/video" element={<BusinessCardVideo />} />
          <Route path="/business-card/design" element={<BusinessCardDesign />} />
        </Routes>
      </main>

      {/* Conditionally render Footer - not on homepage */}
      {shouldShowNavbarFooter && !isHomePage && !isProjectEditorRoute && (
        <footer className="bg-gray-800 text-white p-4 text-center">
          <Footer />
        </footer>
      )}
    </div>
  );
}

export default App;