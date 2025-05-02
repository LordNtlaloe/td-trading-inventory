
import React from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

const Image = ({ src, ...props }: ImageProps) => {
  // Use placeholder image if the source is not available
  const imageSrc = src || "https://images.unsplash.com/photo-1601411101851-ea0e07766235?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHRpcmVzfGVufDB8fDB8fHww";
  
  return <img src={imageSrc} alt="" {...props} />;
};

export default Image;