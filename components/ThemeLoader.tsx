"use client";

import { useEffect } from "react";
import { getConfiguracion } from "@/lib/configuracion";
import { applyTheme } from "@/lib/theme";

export default function ThemeLoader() {
  useEffect(() => {
    getConfiguracion().then((config) => {
      if (!config) return;
      applyTheme(
        config.color_accent || "#C1452A",
        config.color_gold || "#C8932A",
        config.color_teal || "#1F7A6C"
      );
    });
  }, []);

  return null;
}
