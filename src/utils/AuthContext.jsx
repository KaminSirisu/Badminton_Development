import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  account,
  databases,
  storage,
  DATABASE_ID,
  PLAYERS_COLLECTION_ID,
  CLUBS_COLLECTION_ID,
  USERS_COLLECTION_ID,
  CHECKIN_COLLECTION_ID,
  MATCHES_COLLECTION_ID,
  SLIP_STORAGE_ID,
  MONEYSLIP_COLLECTION_ID
} from "../Appwrite";
import { toast } from 'react-hot-toast';
import { ID, Query } from "appwrite";

// Create context
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  // Check user session on app start
  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    setInitialLoading(true);
    try {
        const accountDetails = await account.get();
        setUser(accountDetails);
    } catch (error) {
        // If 401 unauthorized, user is not logged in - clear user
        if (error.code === 401) {
          setUser(null);
        } else {
          console.error("Unexpected error checking user session:", error);
        }
    } finally {
        setInitialLoading(false);
    }
  };

  const loginUser = async (userInfo) => {
    setLoading(true);
    try {
      await account.createEmailPasswordSession(
        userInfo.email,
        userInfo.password
      );
      const accountDetails = await account.get();
      setUser(accountDetails);
      localStorage.setItem("user", JSON.stringify(accountDetails));
      navigate("/");
    } catch (e) {
      toast.error("Please check the email or password.");
      console.error("Login error:", e);
    }
    setLoading(false);
  };

  const registerUser = async (userInfo) => {
    setLoading(true);
    try {
      await account.create(
        ID.unique(),
        userInfo.email,
        userInfo.password1,
        userInfo.name
      );
      // await databases.createDocument(
      //   DATABASE_ID,
      //   USERS_COLLECTION_ID,
      //   ID.unique(),
      //   {
      //     email: userInfo.email,
      //     name: userInfo.name,
      //   }
      // );
      await account.createEmailPasswordSession(
        userInfo.email,
        userInfo.password1
      );

      const accountDetails = await account.get();
      setUser(accountDetails);
      // localStorage.setItem("user", JSON.stringify(accountDetails));
      toast.success("SignUp successfully!")
      navigate("/");
    } catch (e) {
      
      console.error("Register error:", e);
    }
    setLoading(false);
  };

  const logoutUser = async () => {
    await account.deleteSession("current");
    // localStorage.removeItem("user");
    setUser(null);
    navigate("/sign-in");
  };

  // Helper functions using user state
  const getUserName = () => {
    return user?.name || "No name";
  };

  const getAdminNameAcc = () => {
    return user?.labels || ["No label"];
  };

  const createClubs = async (userInfo) => {
    setLoading(true);
    try {
      await databases.createDocument(
        DATABASE_ID,
        CLUBS_COLLECTION_ID,
        ID.unique(),
        {
          name: userInfo.clubName,
          startPrice: userInfo.startPrice,
          playingDay: userInfo.daysPlaying,
          startTime: userInfo.startTime,
          endTime: userInfo.endTime,
          pricePerGame: userInfo.pricePerGame,
        }
      );
      toast.success("Create Club Successfully!");
    } catch (e) {
        console.error("Error creating club:", e);
        toast.error("Failed to create club. Please try again.");
    } finally {
        setLoading(false);
    }
  }

  const getClubData = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DATABASE_ID, CLUBS_COLLECTION_ID);
      const clubs = response.documents.map(doc => ({
        id: doc.$id,
        clubName: doc.name,
        startPrice: doc.startPrice,
        pricePerGame: doc.pricePerGame,
        playingDay: doc.playingDay,
        startTime: doc.startTime,
        endTime: doc.endTime,
      }));
      return clubs;
    } catch (e) {
      console.error("Failed to fetch clubs:", e);
      return [];
    } finally {
      setLoading(false);
    }
  }

  const updateClub = async (clubId, updatedData) => {
    setLoading(true);
    try {
      await databases.updateDocument(
        DATABASE_ID,
        CLUBS_COLLECTION_ID,
        clubId, // using Appwrite's document ID
        {
          name: updatedData.clubName,
          startPrice: updatedData.startPrice,
          playingDay: updatedData.daysPlaying,
          startTime: updatedData.startTime,
          endTime: updatedData.endTime,
          pricePerGame: updatedData.pricePerGame,
        }
      );
      toast.success("Club updated successfully!");
    } catch (e) {
      console.error("Error updating club:", e);
      toast.error("Failed to update club. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const deleteClub = async (clubId) => {
    setLoading(true);
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        CLUBS_COLLECTION_ID,
        clubId
      );
      toast.success("Club deleted successfully!");
    } catch (e) {
      console.error("Error deleting club:", e);
      toast.error("Failed to delete club. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async (playerData) => {
    setLoading(true);
    try {
      const res = await databases.createDocument(
        DATABASE_ID,
        PLAYERS_COLLECTION_ID,
        ID.unique(),
        {
          name: playerData.name,
          skillLevel: playerData.skillLevel,
          club: playerData.clubs,
        }
      );
      toast.success("Player added successfully!");
      return res;
    } catch (e) {
      console.error("Error adding player:", e);
      toast.error("Failed to add player. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPlayers = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DATABASE_ID, PLAYERS_COLLECTION_ID);
      return response.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        skillLevel: doc.skillLevel,
        club: doc.club || [], // safely fallback to empty array
        gamesPlayed: doc.gamesPlayed || 0,
      }));
      
    } catch (e) {
      console.error("Failed to get players:", e);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updatedPlayers = async (playerId, updatedData) => {
    setLoading(true);
    try {
      await databases.updateDocument(
        DATABASE_ID,
        PLAYERS_COLLECTION_ID,
        playerId, // using Appwrite's document ID
        updatedData
      );
    } catch (e) {
      console.error("Failed to Update Players:", e)
    }
  }

  const incrementGamePlayed = async (playerId) => {
    setLoading(true);
    try {
      const playerDoc = await databases.getDocument(
        DATABASE_ID,
        PLAYERS_COLLECTION_ID,
        playerId, // using Appwrite's document ID
      )

      const currentGamePlayed = playerDoc.gamesPlayed || 0;

      await updatedPlayers(playerId, {gamesPlayed: currentGamePlayed + 1});
    } catch (e) {
      console.log("Failed to increment game:", e)
    } finally {
      setLoading(false);
    }
  }

  const deletePlayer = async (playerId, onSuccess) => {
    setLoading(true);
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        PLAYERS_COLLECTION_ID,
        playerId
      );
      toast.success("Player deleted successfully!");
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error("Error deleting player:", e);
      toast.error("Failed to delete player. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createCheckIn = async ({ name, clubId, checkInTime }) => {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,     
        CHECKIN_COLLECTION_ID, 
        ID.unique(),            // Auto-generated ID
        {
          name,     // Assumes you have user object
          clubId,
          checkInTime,
          createAt: new Date().toISOString(), // Or let Appwrite handle this if set as default
        }
      );
      toast.success("Check-In successfully!")
      return response;
    } catch (err) {
      console.error('Failed to create check-in:', err);
      throw err;
    }
  };

  const getCheckIn = async (club) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHECKIN_COLLECTION_ID,
        [
          Query.equal("clubId", club.id),
        ]
      );
      // Sort earliest to latest by checkInTime (e.g., 20:00 → 20:30 → 21:00)
      const sorted = response.documents.sort((a, b) =>
        a.checkInTime.localeCompare(b.checkInTime)
      );

      return sorted;
    } catch (e) {
      console.error("Failed to fetch check-ins:", e);
    }
  }

  const clearCheckIns = async () => {
    try {
      // List all check-in documents
      const oneDayAgoISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const response = await databases.listDocuments(DATABASE_ID, CHECKIN_COLLECTION_ID, [
        Query.lessThan("createAt", oneDayAgoISO)
      ]);

      if (response.documents.length === 0) {
        console.log("No check-ins to delete.");
        return;
      }

      // Delete all documents concurrently
      await Promise.all(
        response.documents.map(doc =>
          databases.deleteDocument(DATABASE_ID, CHECKIN_COLLECTION_ID, doc.$id)
        )
      );

      console.log(`Deleted ${response.documents.length} check-ins.`);
    } catch (error) {
      console.error("Failed to clear check-ins:", error);
    }
  }


  const createMatch = async ({players, court}) => {
    try {
      await databases.createDocument(
        DATABASE_ID,
        MATCHES_COLLECTION_ID,
        ID.unique(),
        {
          players,
          court,
          startTime: new Date().toISOString(),
        }
      )
      toast.success("Match End");
    } catch (e) {
      console.error("Failed to create match:", e);
      throw e;
    }
  }

  const getMatches = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        MATCHES_COLLECTION_ID,
        [
          Query.orderDesc('startTime'), // newest first
        ]
      );

      // response.documents will be an array of your match documents
      return response.documents.map(doc => ({
        id: doc.$id,
        players: doc.players || [],
        court: doc.court,
        startTime: doc.startTime
      }))
    } catch (e) {
      console.error("Failed to fetch matches:", e);
      throw e;
    }
  };

  const clearMatchesAndResetPlayers = async () => {
    try {
      // 1. Fetch all match documents
      const matches = await databases.listDocuments(
        DATABASE_ID,
        MATCHES_COLLECTION_ID
      );

      // 2. Fetch all users
      const players = await databases.listDocuments(
        DATABASE_ID,
        PLAYERS_COLLECTION_ID
      );

      // 3. Delete all match documents in parallel
      await Promise.all(
        matches.documents.map((match) =>
          databases.deleteDocument(DATABASE_ID, MATCHES_COLLECTION_ID, match.$id)
        )
      );

      // 4. Reset gamesPlayed to 0 for all PLAYERS in parallel
      await Promise.all(
        players.documents.map((player) =>
          databases.updateDocument(DATABASE_ID, PLAYERS_COLLECTION_ID, player.$id, {
            gamesPlayed: 0,
          })
        )
      );

      return true;
    } catch (error) {
      console.error("Error clearing data:", error);
      return false;
    }
  };

  const uploadSlipToAppwrite = async ({ file, clubId, userName }) => {
    console.log(file, clubId, userName);
    if (!file || !clubId || !userName) {
      throw new Error("Missing required data");
    }

    // Step 1: Check for existing slip for this user + club
    const existing = await databases.listDocuments(
      DATABASE_ID,
      MONEYSLIP_COLLECTION_ID,
      [
        Query.equal("user", userName),
        Query.equal("club", clubId)
      ]
    );

    if (existing.documents.length > 0) {
      const oldDoc = existing.documents[0];

      // Delete the old file from storage
      try {
        await storage.deleteFile(SLIP_STORAGE_ID, oldDoc.fileId);
      } catch (e) {
        console.warn("Failed to delete old file, continuing:", e);
      }

      // Delete the old metadata document
      try {
        await databases.deleteDocument(DATABASE_ID, MONEYSLIP_COLLECTION_ID, oldDoc.$id);
      } catch (e) {
        console.warn("Failed to delete old document, continuing:", e);
      }
    }

    // Step 2: Upload new file
    const fileUpload = await storage.createFile(
      SLIP_STORAGE_ID,
      ID.unique(),
      file
    );

    // Step 3: Save metadata
    const doc = await databases.createDocument(
      DATABASE_ID,
      MONEYSLIP_COLLECTION_ID,
      ID.unique(),
      {
        user: userName,
        club: clubId,
        fileId: fileUpload.$id,
        timestamp: new Date().toISOString(),
      }
    );

    return { file: fileUpload, document: doc };
  };


  const getUserFileId = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        MONEYSLIP_COLLECTION_ID,
      )
      return response.documents.map(doc => ({
        user: doc.user,
        fileId: doc.fileId,
        timestamp: doc.timestamp,
        club: doc.club
      }))
    } catch (e) {
      console.error("Error fetching user file data:", e);
      return [];
    }
  }

  const getUploadedSlipsByUser = async (userId) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        MONEYSLIP_COLLECTION_ID,
        [Query.equal("userId", userId)]
      );

      // Attach preview URL to each slip
      const slipsWithPreview = response.documents.map((doc) => ({
        ...doc,
        previewUrl: storage.getFilePreview(
          SLIP_STORAGE_ID,
          doc.fileId
        ).href,
      }));

      return slipsWithPreview;
    } catch (err) {
      console.error("Error fetching user slips:", err);
      throw err;
    }
  }

  const getPreviewUrlsFromFileIds = (fileIds) => {
    return fileIds.map(fileId => ({
      getUserFileId,
      fileId,
      previewUrl: storage.getFileDownload(SLIP_STORAGE_ID, fileId),
    }));
  };

  const getPreviewUrlsFromDocs = (docs) => {
    return docs.map(doc => ({
      user: doc.user,
      timestamp: doc.timestamp,
      club: doc.club,
      fileId: doc.fileId,
      previewUrl: storage.getFileDownload(SLIP_STORAGE_ID, doc.fileId)
    }));
  };

  const updateUserName = async (newName) => {
    if (!newName) throw new Error("Name is required");

    try {
      const updatedUser = await account.updateName(newName);
      toast.success("Name updated:", updatedUser);
      console.log("Name updated:", updatedUser);
      return updatedUser;
    } catch (error) {
      toast.error("Failed to update name")
      console.error("Failed to update name:", error);
      throw error;
    }
  };

  const fetchUser = async () => {
    const userData = await account.get();  // or your API call to get current user info
    setUser(userData);
  };

  
  // Context value
  const contextData = {
    user,
    loginUser,
    logoutUser,
    registerUser,
    loading,
    getUserName,
    getAdminNameAcc,
    createClubs,
    getClubData,
    updateClub,
    deleteClub,
    addPlayer,
    getPlayers,
    updatedPlayers,
    deletePlayer,
    createCheckIn,
    clearCheckIns,
    createMatch,
    getMatches,
    incrementGamePlayed,
    getCheckIn,
    clearMatchesAndResetPlayers,
    uploadSlipToAppwrite,
    getUploadedSlipsByUser,
    getUserFileId,
    getPreviewUrlsFromFileIds,
    getPreviewUrlsFromDocs,
    updateUserName,
    fetchUser
  };

  return (
    <AuthContext.Provider value={contextData}>
      {initialLoading ? (
        <div className="flex justify-center items-center bg-blue-50 w-screen h-screen">
          <p className="font-semibold text-blue-700 text-lg">Loading...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
