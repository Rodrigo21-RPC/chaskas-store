import React from "react";
const paths = {
  bag: (
    <>
      <path d="M6 7h12l1 14H5L6 7Z" />
      <path d="M9 8V5a3 3 0 0 1 6 0v3" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2H4Z" />
    </>
  ),
  store: (
    <>
      <path d="m4 3-2 7c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0l-2-7H4Z" />
      <path d="M4 13v8h16v-8M9 21v-6h6v6M8 3l-1 7m5-7v7m4-7 1 7" />
    </>
  ),
  back: (
    <>
      <path d="m10 4-8 8 8 8M2 12h20" />
    </>
  ),
  plus: <path d="M12 4v16M4 12h16" />,
  check: <path d="m4 12 5 5L20 6" />,
  upload: (
    <>
      <path d="M7 17H5a4 4 0 0 1-1-8 8 8 0 0 1 15-1 5 5 0 0 1 0 10h-2M12 21V9m-4 4 4-4 4 4" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M21 11.5a9 9 0 0 1-13 8L2 22l2.5-6A9 9 0 1 1 21 11.5Z" />
      <path d="M8 7c-2 4 2 8 6 9l2-3-3-1-1 1-2-2 1-1-1-3H8Z" />
    </>
  ),
};
export function Icon({ name, ...props }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.bag}
    </svg>
  );
}
