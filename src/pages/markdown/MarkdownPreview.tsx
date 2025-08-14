import "./markdown.css";

import MarkdownPreview from "@uiw/react-markdown-preview";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import React from "react";

import "katex/dist/katex.min.css";

const MdPreview = ({
  source,
  style,
  className,
}: {
  source: string;
  style?: React.CSSProperties;
  className?: string;
}) => {
  return (
    <div className={`markdown-preview ${className || ""}`}>
      <MarkdownPreview
        source={source}
        style={style}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        rehypeRewrite={node => {
          if (hackyCast(node)?.tagName === "a") {
            hackyCast(node).properties.target = "_blank";
            hackyCast(node).properties.rel = "noopener noreferrer";
          }
        }}
        wrapperElement={{
          "data-color-mode": "dark",
        }}
      />
    </div>
  );
};

const hackyCast = (node: any): any => node;

export default MdPreview;
