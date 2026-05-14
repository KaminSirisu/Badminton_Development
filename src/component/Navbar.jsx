import { useEffect, useState } from 'react';
import { LogOut } from "lucide-react";
import { useAuth } from '../utils/AuthContext';
import { Link, useLocation } from "react-router-dom";
import PreviewFilesList from './PreviewFilesList.jsx';
import menu from "../assets/menu.svg"; // your hamburger icon
import close from "../assets/close.svg"; // your close icon
import Batminton from "../assets/badminton.png";
import { useLanguage } from '../utils/LanguageProvider.jsx';


const Navbar = () => {
  const { t, changeLanguage, language } = useLanguage();

  const [previewFiles, setPreviewFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const { getAdminNameAcc, getUserName, logoutUser, getUserFileId, getPreviewUrlsFromDocs }  = useAuth();
  const [toggle, setToggle] = useState(false);
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [admin, setAdmin] = useState([]);

  const location = useLocation();
  let summaryLink = null;
  let showMoneySlipButton = false;

  if (location.pathname.startsWith("/matchmaking/")) {
    const id = location.pathname.split("/")[2]; // grab '12345' from '/matchmaking/12345'
    summaryLink = `/summary/${id}`;
  } else if (location.pathname.startsWith("/summary/")) {
    const id = location.pathname.split("/")[2]; // grab '12345' from '/matchmaking/12345'
    showMoneySlipButton = true;
  }

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     const files = await getUserFileId();
  //     const userIds = files.map(file => file.fileId);
  //     console.log("User IDs:", userIds);
  //   };

  //   fetchUsers();
  // }, []);

  const loadPreviews = async () => {
    const fileData = await getUserFileId(); // returns [{ user, fileId, ... }, ...]
    const previewFiles = getPreviewUrlsFromDocs(fileData);

    setPreviewFiles(previewFiles);
    // Output: [{ fileId: 'abc123', previewUrl: 'https://...' }, ...]
  };

  useEffect(() => {
    loadPreviews();
  }, [])
  

  // useEffect(() => {
  //   const handleScroll = () => {
  //     setScrolled(window.scrollY > 100);
  //   };
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      const [name, admin] = await Promise.all([
        getUserName(),
        getAdminNameAcc()
      ]);
      setName(name);
      setAdmin(admin);
    };
    fetchData();
  }, []);

  return (
  
    <nav
      className={` rounded-xl w-full flex items-center py-3 sticky top-0 z-20 bg-gray-50 border border-gray-300 shadow-md transition-shadow duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <div className="flex justify-between items-center mx-auto px-4 md:px-10 w-full max-w-7xl">
        {/* Left: Club Text */}
        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={() => {
            setActive("");
            window.scrollTo(0, 0);
          }}
        >
          <p className="font-semibold text-[14px] text-black md:text-[22px]">
            Batminton Club
          </p>
          <img src={Batminton} alt="Batminton" className="self-center w-6 h-6" />
        </Link>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-4">
          {/* Money Slip */}
          {showMoneySlipButton && (
            <button
              onClick={() => setShowModal(true)}
              className="font-medium text-[14px] text-black hover:text-blue-600 transition"
            >
              {t('Money Slip')}
            </button>
          )}
          {summaryLink && (
            <Link
              to={summaryLink}
              className="font-medium text-[14px] text-black hover:text-blue-600 transition"
            >
              {t('summary')}
            </Link>
          )}
          <Link to="/setting" className="font-medium text-[14px] text-black hover:text-blue-600">
            {t('setting')}
          </Link>
          {/* Vertical divider line */}
          <div className="bg-neutral-300 w-px h-6" />
          <span className="font-medium text-[14px] text-gray-700">{name}</span>
          <button
            onClick={logoutUser}
            className="font-medium text-[14px] text-black hover:text-red-600"
          >
            <LogOut size={18} className='text-red-600'/>
            
          </button>
          {/* Vertical divider line */}
          <div className="bg-neutral-300 w-px h-6" />
          <div className='flex space-x-1'>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2 py-1 rounded-lg text-xs md:text-sm ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('th')}
              className={`px-2 py-1 rounded-lg text-xs md:text-sm ${language === 'th' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              TH
            </button>
          </div>
          

        </div>

        
        {/* Mobile Hamburger */}
        <div className="md:hidden flex justify-end items-center">
          <img
            src={toggle ? close : menu}
            alt="menu"
            className="invert w-[20px] md:w-[28px] h-[20px] md:h-[28px] object-contain cursor-pointer"
            onClick={() => setToggle(!toggle)}
          />
          <div
            className={`${
              !toggle ? "hidden" : "flex"
            } p-6 bg-white shadow-md absolute top-16 right-4 rounded-xl flex-col gap-4 z-30 items-center text-center`}
          >
            <span className="font-medium text-[14px] text-gray-700">{name}</span>
            {/* Horizontal line */}
            <div className="bg-neutral-300 w-full h-px" />
            {showMoneySlipButton && (
              <button
                onClick={() => setShowModal(true)}
                className="font-medium text-[14px] text-black hover:text-blue-600 transition"
              >
                {t('Money Slip')}
              </button>
            )}
            {summaryLink && (
              <Link
                to={summaryLink}
                onClick={() => setToggle(false)}
                className="font-medium text-[14px] text-black hover:text-blue-600 transition"
              >
                {t('summary')}
              </Link>
            )}
            <Link
              to="/setting"
              onClick={() => setToggle(false)}
              className="font-medium text-[14px] text-black hover:text-blue-600"
            >
              {t('setting')}
            </Link>
            <button
              onClick={() => {
                logoutUser();
                setToggle(false);
              }}
              className="font-medium text-[14px] text-black hover:text-red-600"
            >
              <LogOut size={18} className='text-red-600'/>
            </button>
            {/* Horizontal line */}
            <div className="bg-neutral-300 w-full h-px" />
            <h1 className='text-xs'>{t('change language')}</h1>
            <div className='flex space-x-2'>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1 rounded-lg text-sm ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('th')}
                className={`px-3 py-1 rounded-lg text-sm ${language === 'th' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                TH
              </button>
            </div>

          </div>
        </div>
        {showModal && (
          <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
              <div className="bg-white shadow-lg p-6 rounded-xl w-[90%] max-w-md">
                <h2 className="mb-4 font-semibold text-xl">{t('Money Slip')}</h2>
                <PreviewFilesList previewFiles={previewFiles} />
                <div className="mt-4 text-right">
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
          </div>
        )}

      </div>
    </nav>
  );

}

export default Navbar