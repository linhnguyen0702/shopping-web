import PropTypes from "prop-types";
import { cn } from "./ui/cn";

const Container = ({ children, className }) => {
  return (
    <div className={cn("max-w-screen-xl mx-auto px-4 py-10", className)}>
      {children}
    </div>
  );
};

Container.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export default Container;
