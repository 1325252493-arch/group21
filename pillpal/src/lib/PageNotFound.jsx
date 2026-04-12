import { useLocation, useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  const location = useLocation();
  const nav = useNavigate();

  const pageName = location.pathname;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          {/* 404 */}
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-slate-300">404</h1>
            <div className="h-0.5 w-16 bg-slate-200 mx-auto" />
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-slate-800">
              {t("page_not_found") || "Page Not Found"}
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              {t("page_not_found_desc") || "The page"}{" "}
              <span className="font-medium text-slate-700">{pageName}</span>{" "}
              {t("page_not_found_desc_2") || "could not be found."}
            </p>
          </div>

          {/* Action */}
          <div className="pt-6">
            <Button className="h-12 px-6 text-lg rounded-xl" onClick={() => nav("/", { replace: true })}>
              {t("go_home") || "Go Home"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}