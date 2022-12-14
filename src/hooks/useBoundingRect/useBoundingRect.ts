import { requestTimeout } from 'helpers/'
import { useState, useCallback, useLayoutEffect } from "react";

let timeoutId: any = null;
// let timeoutRequest: any = null;

const debounce = (delay: number = 0, callback: Function) => {
  return (...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(callback, delay, args);

    // if (timeoutRequest) {
    //   timeoutRequest.clear();
    // }
    // timeoutRequest = requestTimeout(callback, delay);
  };
};

export type Dimensions = {
  x: number
  y: number
  top: number
  left: number
  width: number
  height: number
  right: number
  bottom: number
}

const initialDimensions: Dimensions = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  right: 0,
  bottom: 0
}

function getDimensionObject(node: any): Dimensions {
  const rect = node.getBoundingClientRect();
  return {
    x: rect.x,
    y: rect.y,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom
  };
}

export default function useBoundingRect(delay: number = 0) {
  const [node, setNode] = useState<any>(null);
  const [dimensions, setDimensions] = useState<Dimensions>(initialDimensions);

  const ref = useCallback((node: any) => {
    setNode(node);
  }, []);

  useLayoutEffect(() => {
    if ("undefined" !== typeof window && node) {
      const measure = async () => {
        window.requestAnimationFrame(() => {
          // console.log('measure', getDimensionObject(node))
          setDimensions(getDimensionObject(node))
        });
      }

      measure();

      const listener = debounce(delay || 100, measure);

      window.addEventListener("resize", listener);
      window.addEventListener("scroll", listener);
      
      return () => {
        window.removeEventListener("resize", listener);
        window.removeEventListener("scroll", listener);
      };
    }
  }, [node, delay]);

  return [ref, dimensions, node];
}
