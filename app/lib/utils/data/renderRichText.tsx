import { ReactNode } from "react";

const renderRichText = (datum: string): ReactNode => (
  <div dangerouslySetInnerHTML={{ __html: datum }} />
);

export default renderRichText;
