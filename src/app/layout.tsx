import { PrismicPreview } from "@prismicio/next";
import { repositoryName } from "@/prismicio";
import './style.css';
import React from "react";

export default function RootLayout({
                                     children,
                                   } : {
  children : React.ReactNode;
}) {
  return (
      <html lang="en">
      <head>
        <link
            rel="icon"
            type="image/png"
            sizes="any"
            href="https://prismic.io/favicon.ico"
        />
      </head>
      <body className="flex flex-col items-center bg-stone-50">
      <div
          className="bg-white max-2-7xl min-h-screen border-x border-solid border-gray-200 p-12 w-full flex flex-col items-center text-slate-700">
        {children}
        <PrismicPreview repositoryName={repositoryName}/>
      </div>
      </body>
      </html>
  )
}
