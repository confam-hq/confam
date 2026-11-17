import logo from "../../assets/logo.png";

export default function ConfamLogo({ size = 32 }: { size?: number }) {
  return <img src={logo} alt="Confam" style={{ height: size, width: "auto" }} className="object-contain" />;
}