import PropTypes from "prop-types";

const Badge = ({ text }) => {
  return (
    <div className="bg-primary/80 text-white px-4 py-1 flex justify-center items-center font-semibold hover:bg-black  rounded-md text-xs duration-300 cursor-pointer">
      {text}
    </div>
  );
};

Badge.propTypes = {
  text: PropTypes.string.isRequired,
};

export default Badge;
