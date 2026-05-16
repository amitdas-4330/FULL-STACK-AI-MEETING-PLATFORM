import { FaClipboardList, FaHome, FaMicrophoneAlt } from "react-icons/fa";
import { MdHistory, MdInfo } from "react-icons/md";

const Sidebar = () => {

  const links = [
    {
      href: "#home",
      label: "Home",
      icon: <FaHome size={20} />,
    },
    {
      href: "#transcript",
      label: "Transcript",
      icon: <FaMicrophoneAlt size={20} />,
    },
    {
      href: "#summary",
      label: "Summary",
      icon: <MdHistory size={22} />,
    },
    {
      href: "#about",
      label: "About",
      icon: <MdInfo size={22} />,
    },
  ];

  return (
    <aside
      className="
        hidden
        lg:block
        fixed
        left-0
        top-[80px]
        w-[250px]
        h-[calc(100vh-80px)]
        bg-slate-900
        border-r
        border-slate-700
        p-5
      "
    >
      <div className="mb-5 px-1">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
          Workspace
        </p>

        <h2 className="font-bold text-lg">
          Meeting Tools
        </h2>
      </div>

      <div className="space-y-3">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="bg-slate-800 hover:bg-slate-700 transition p-4 rounded-2xl flex items-center gap-3"
          >
            {link.icon}
            <span className="font-medium">
              {link.label}
            </span>
          </a>
        ))}

        <a
          href="#summary"
          className="bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 transition p-4 rounded-2xl flex items-center gap-3"
        >
          <FaClipboardList size={20} />
          <span className="font-medium">
            Attendance
          </span>
        </a>
      </div>
    </aside>
  );

};

export default Sidebar;
