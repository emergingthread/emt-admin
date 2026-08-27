declare module "swagger-ui-react" {
  import type { ComponentType } from "react";

  type SwaggerUIProps = {
    spec: Record<string, unknown>;
  };

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
