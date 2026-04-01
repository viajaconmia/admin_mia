import { useEffect, useState } from "react";

export function useWindowHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    function update() {
      if (window.innerHeight > 700) {
        setHeight(700);
      } else if (window.innerHeight < 500) {
        setHeight(500);
      } else {
        setHeight(window.innerHeight);
      }
    }

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  return height;
}
