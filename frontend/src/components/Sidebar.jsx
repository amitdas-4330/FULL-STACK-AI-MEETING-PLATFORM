import { FaClipboardList } from "react-icons/fa";
import { MdHistory } from "react-icons/md";

const Sidebar = () => {

  return (
    <aside
      className="
        hidden
        lg:block
        fixed
        left-0
        top-[80px]
        w-[250px]
        h-screen
        bg-slate-900
        border-r
        border-slate-700
        p-5
      "
    >

      <div className="bg-slate-800 hover:bg-slate-700 transition p-4 rounded-2xl flex items-center gap-3 cursor-pointer mb-4">

        <FaClipboardList size={22} />

        <span className="font-medium">
          Attendance
        </span>

      </div>

      <div className="bg-slate-800 hover:bg-slate-700 transition p-4 rounded-2xl flex items-center gap-3 cursor-pointer">

        <MdHistory size={22} />

        <span className="font-medium">
          Summary History
        </span>

      </div>

    </aside>
  );
};

export default Sidebar;