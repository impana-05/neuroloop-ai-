import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Search, Filter, Trash2, Loader2, Play } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Link } from "react-router-dom";

export default function Library() {
  const { user } = useAuth();
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchContents = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "contents"), 
          where("userId", "==", user.uid),
          where("deleted", "==", false),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedContents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setContents(fetchedContents);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "contents");
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, [user]);

  const handleDelete = async (contentId: string) => {
    try {
      const contentRef = doc(db, "contents", contentId);
      await updateDoc(contentRef, { deleted: true });
      setContents(contents.filter(c => c.id !== contentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `contents/${contentId}`);
    }
  };

  const filteredContents = contents.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Neural Library</h1>
          <p className="text-text-muted text-sm">Access and manage your synchronized conceptual nodes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-border rounded-xl text-sm focus:outline-none focus:border-accent transition-colors w-64"
            />
          </div>
          <button className="p-2 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition-all">
            <Filter className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
        </div>
      ) : filteredContents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.map((content, index) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-panel p-6 group hover:border-accent/30 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(content.id)}
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>

              <h3 className="text-lg font-bold mb-2 group-hover:text-accent transition-colors line-clamp-1">{content.title}</h3>
              <p className="text-sm text-text-muted mb-6 line-clamp-2">
                {content.concepts?.length || 0} conceptual nodes identified. Last synchronized {new Date(content.createdAt).toLocaleDateString()}.
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-bg bg-white/10" />
                  ))}
                </div>
                <Link 
                  to={`/quiz?id=${content.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm font-bold hover:bg-accent hover:text-white transition-all"
                >
                  <Play className="w-4 h-4" />
                  Start Loop
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white/3 border border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
            <BookOpen className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold mb-2">Your library is empty</h3>
          <p className="text-text-muted mb-8 max-w-sm mx-auto">Upload educational materials to begin building your neural knowledge base.</p>
          <Link 
            to="/upload" 
            className="px-8 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all shadow-xl shadow-accent/20"
          >
            Initialize First Path
          </Link>
        </div>
      )}
    </div>
  );
}
