"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream border-b border-silver">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/Logo-MasteryPath.svg"
            alt="MasteryPath logo"
            width={24}
            height={24}
            unoptimized
            className="h-auto"
          />
          <span className="font-cormorant font-semibold text-base text-teal tracking-tight">
            MasteryPath
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#how-it-works"
            className="font-syne font-normal text-base text-black hover:text-teal transition-colors"
          >
            How it works
          </a>
          <a
            href="#tracks"
            className="font-syne font-normal text-base text-black hover:text-teal transition-colors"
          >
            Subjects
          </a>
          <a
            href="#pricing"
            className="font-syne font-normal text-base text-black hover:text-teal transition-colors"
          >
            Pricing
          </a>
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/sign-in"
            className="bg-off-white px-5 py-2 font-syne font-normal text-base text-teal hover:bg-teal-light transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="bg-teal px-5 py-2 font-syne font-normal text-base text-blush hover:bg-teal-dark transition-colors"
          >
            Sign up
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-black"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-off-white border-t border-divider px-6 py-4 flex flex-col gap-4">
          <a
            href="#how-it-works"
            className="font-syne font-normal text-base text-black"
            onClick={() => setMenuOpen(false)}
          >
            How it works
          </a>
          <a
            href="#tracks"
            className="font-syne font-normal text-base text-black"
            onClick={() => setMenuOpen(false)}
          >
            Subjects
          </a>
          <a
            href="#pricing"
            className="font-syne font-normal text-base text-black"
            onClick={() => setMenuOpen(false)}
          >
            Pricing
          </a>
          <hr className="border-divider" />
          <Link
            href="/sign-in"
            className="font-syne font-normal text-base text-teal"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="bg-teal px-5 py-2.5 font-syne font-normal text-base text-blush text-center"
          >
            Sign up
          </Link>
        </div>
      )}
    </header>
  );
}
