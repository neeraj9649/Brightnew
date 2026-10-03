'use client';
import { useCallback, useEffect, useState, useRef } from "react";

const useScrollUp = (scrollSize: number = 0): boolean => {
    const [scrollTop, setScrollTop] = useState<boolean>(false);
    const lastScrollTop = useRef<number>(0);

    const handleSet = useCallback(() => {
        const currentScrollTop = window.scrollY;

        if (currentScrollTop > scrollSize) {
            if (currentScrollTop > lastScrollTop.current) {
                setScrollTop(false);
            } else {
                setScrollTop(true);
            }
        } else {
            setScrollTop(false);
        }

        lastScrollTop.current = currentScrollTop;
    }, [scrollSize]);

    useEffect(() => {
        window.addEventListener("scroll", handleSet);
        return () => window.removeEventListener("scroll", handleSet);
    }, [handleSet]);

    return scrollTop;
};

export default useScrollUp;
