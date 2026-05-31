import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { EmojiIcon } from '../components/EmojiIcon';

type NewsCategory = 'all' | 'badminton' | 'pickleball' | 'gear';

const decodeHTMLEntities = (text: string) => {
    if (!text) return '';
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    // Decode twice to handle double-encoded entities like &amp;aacute;
    let decoded = textArea.value;
    textArea.innerHTML = decoded;
    return textArea.value;
};

interface Article {
    id: string;
    title: string;
    category: NewsCategory;
    summary: string;
    date: string;
    imageUrl: string;
    readTime: number;
    isHot?: boolean;
    link?: string;
}

export default function NewsPage() {
    const [activeTab, setActiveTab] = useState<NewsCategory>('all');
    const [news, setNews] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Fetch song song 4 luồng RSS: Thể thao chung (VnExpress, Thanh Niên, Tuổi Trẻ) và Cầu lông chuyên biệt (WebTheThao)
                const [vnexpressRes, thanhnienRes, tuoitreRes] = await Promise.all([
                    fetch('https://api.rss2json.com/v1/api.json?rss_url=https://vnexpress.net/rss/the-thao.rss'),
                    fetch('https://api.rss2json.com/v1/api.json?rss_url=https://thanhnien.vn/rss/the-thao.rss'),
                    fetch('https://api.rss2json.com/v1/api.json?rss_url=https://tuoitre.vn/rss/the-thao.rss')
                ]);

                const vnData = await vnexpressRes.json();
                const tnData = await thanhnienRes.json();
                const ttData = await tuoitreRes.json();

                let allItems: any[] = [];
                if (vnData.status === 'ok') allItems = [...allItems, ...vnData.items];
                if (tnData.status === 'ok') allItems = [...allItems, ...tnData.items];
                if (ttData.status === 'ok') allItems = [...allItems, ...ttData.items];

                const articles: Article[] = allItems.map((item: any, index: number) => {
                    // Trích xuất URL ảnh (từ enclosure hoặc description)
                    let imageUrl = item.thumbnail;
                    if (!imageUrl && item.enclosure && item.enclosure.link) imageUrl = item.enclosure.link;
                    if (!imageUrl) {
                        const match = item.description.match(/<img[^>]+src=["']([^"']+)["']/);
                        if (match) imageUrl = match[1];
                    }

                    // Decode HTML entities trong URL ảnh (ví dụ: &amp; -> &)
                    if (imageUrl) {
                        imageUrl = imageUrl.replace(/&amp;/g, '&');
                    }

                    // Làm sạch HTML tag trong mô tả và decode text
                    const rawSummary = item.description.replace(/<[^>]+>/g, '').trim();
                    const summary = decodeHTMLEntities(rawSummary);
                    const cleanTitle = decodeHTMLEntities(item.title);
                    const titleLower = cleanTitle.toLowerCase();

                    // Phân loại tự động
                    let cat: NewsCategory = 'all';
                    if (titleLower.includes('pickleball')) cat = 'pickleball';
                    else if (titleLower.includes('vợt') || titleLower.includes('giày')) cat = 'gear';
                    else if (titleLower.includes('cầu lông') || titleLower.includes('lin dan') || titleLower.includes('axelsen') || (item.link && item.link.includes('cau-long'))) cat = 'badminton';

                    return {
                        id: item.guid || String(index),
                        title: cleanTitle,
                        category: cat,
                        summary: summary,
                        date: item.pubDate ? item.pubDate.split(' ')[0] : 'Gần đây',
                        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
                        readTime: Math.max(2, Math.floor(summary.length / 100)),
                        isHot: index < 2,
                        link: item.link
                    };
                });

                // Sắp xếp bài mới nhất lên đầu
                articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                // Cập nhật dữ liệu từ API
                setNews(articles);
            } catch (error) {
                console.error("Failed to fetch news", error);
                setNews([]); // Fallback nếu API lỗi
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const filteredNews = news.filter(n => activeTab === 'all' || n.category === activeTab);

    return (
        <div className="w-full h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar bg-[#090b10] relative font-sans text-gray-300">
            
            {/* Animated Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            <div className="max-w-[1400px] mx-auto p-6 md:p-10 pb-24 space-y-12 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div className="flex flex-col gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest w-fit mb-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span> Live Updates
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-500 tracking-tight">
                            Tin Tức & Giải Đấu
                        </h1>
                        <p className="text-gray-400 text-lg font-medium max-w-xl">
                            Cập nhật 24/7 mọi thông tin nóng hổi nhất từ các giải đấu cầu lông và pickleball hàng đầu.
                        </p>
                    </div>

                    {/* Tabs */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap gap-2 p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-fit"
                    >
                        {[
                            { id: 'all', label: 'Tất cả', icon: null },
                            { id: 'badminton', label: 'Cầu lông', icon: 'badminton' },
                            { id: 'pickleball', label: 'Pickleball', icon: 'pickleball' },
                            { id: 'gear', label: 'Đồ tập', icon: null }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as NewsCategory)}
                                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                                    activeTab === tab.id 
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab.icon && <EmojiIcon name={tab.icon as any} className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'opacity-70'}`} />}
                                {tab.label}
                            </button>
                        ))}
                    </motion.div>
                </motion.div>

                {/* News Layout */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[600px] gap-8">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(59,130,246,0.6)]"></div>
                        </div>
                        <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-black animate-pulse tracking-widest text-lg uppercase">Đang đồng bộ dữ liệu...</p>
                    </div>
                ) : filteredNews.length > 0 ? (
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-8"
                    >
                        {/* Premium Bento Box Hero Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[250px] md:auto-rows-[300px]">
                            
                            {/* Item 1: Giant Featured (2x2) */}
                            {filteredNews[0] && (
                                <motion.div
                                    layout
                                    className="lg:col-span-2 lg:row-span-2 group relative rounded-[2rem] overflow-hidden cursor-pointer"
                                    onClick={() => { if (filteredNews[0].link) window.open(filteredNews[0].link, '_blank'); }}
                                >
                                    {/* Glass Frame */}
                                    <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[2rem] z-20 pointer-events-none group-hover:border-blue-500/50 transition-colors duration-500"></div>
                                    
                                    <img src={filteredNews[0].imageUrl} alt={filteredNews[0].title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                                    <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500 z-10" />
                                    
                                    <div className="absolute top-6 left-6 z-30 flex gap-2">
                                        <div className="bg-red-500 text-white text-xs font-black uppercase px-4 py-2 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center gap-1.5 backdrop-blur-md">
                                            <TrendingUp className="w-4 h-4" /> Top 1
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-30 transform group-hover:-translate-y-4 transition-transform duration-500">
                                        <div className="flex items-center gap-4 text-xs font-black text-blue-400 mb-4 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5 bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/30 backdrop-blur-md">
                                                {filteredNews[0].category}
                                            </span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {filteredNews[0].date}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            <span>{filteredNews[0].readTime} p</span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-[1.15] group-hover:text-blue-300 transition-colors line-clamp-3 drop-shadow-2xl">
                                            {filteredNews[0].title}
                                        </h2>
                                        <p className="text-gray-300 line-clamp-2 md:text-lg font-medium drop-shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
                                            {filteredNews[0].summary}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Item 2: Tall Portrait (1x2) */}
                            {filteredNews[1] && (
                                <motion.div
                                    layout
                                    className="lg:col-span-1 lg:row-span-2 group relative rounded-[2rem] overflow-hidden cursor-pointer"
                                    onClick={() => { if (filteredNews[1].link) window.open(filteredNews[1].link, '_blank'); }}
                                >
                                    <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[2rem] z-20 pointer-events-none group-hover:border-purple-500/50 transition-colors duration-500"></div>
                                    
                                    <img src={filteredNews[1].imageUrl} alt={filteredNews[1].title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-30 transform group-hover:-translate-y-2 transition-transform duration-500">
                                        <div className="flex items-center gap-3 text-xs font-black text-purple-400 mb-3 uppercase tracking-widest">
                                            <span>{filteredNews[1].category}</span>
                                            <span className="w-1 h-1 rounded-full bg-purple-400"></span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {filteredNews[1].date}</span>
                                        </div>
                                        <h2 className="text-xl md:text-3xl font-black text-white leading-tight group-hover:text-purple-300 transition-colors line-clamp-4 drop-shadow-xl">
                                            {filteredNews[1].title}
                                        </h2>
                                    </div>
                                </motion.div>
                            )}

                            {/* Item 3: Square (1x1) */}
                            {filteredNews[2] && (
                                <motion.div
                                    layout
                                    className="lg:col-span-1 lg:row-span-1 group relative rounded-[2rem] overflow-hidden cursor-pointer bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors duration-500 p-2"
                                    onClick={() => { if (filteredNews[2].link) window.open(filteredNews[2].link, '_blank'); }}
                                >
                                    <div className="w-full h-full relative rounded-3xl overflow-hidden">
                                        <img src={filteredNews[2].imageUrl} alt={filteredNews[2].title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                                        
                                        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                                            <div className="text-[10px] font-black text-emerald-400 mb-2 uppercase tracking-widest">{filteredNews[2].category}</div>
                                            <h3 className="text-lg font-bold text-white line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors">{filteredNews[2].title}</h3>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Item 4: Square (1x1) */}
                            {filteredNews[3] && (
                                <motion.div
                                    layout
                                    className="lg:col-span-1 lg:row-span-1 group relative rounded-[2rem] overflow-hidden cursor-pointer bg-white/5 border border-white/10 hover:border-orange-500/50 transition-colors duration-500 p-2"
                                    onClick={() => { if (filteredNews[3].link) window.open(filteredNews[3].link, '_blank'); }}
                                >
                                    <div className="w-full h-full relative rounded-3xl overflow-hidden">
                                        <img src={filteredNews[3].imageUrl} alt={filteredNews[3].title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
                                        
                                        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                                            <div className="text-[10px] font-black text-orange-400 mb-2 uppercase tracking-widest">{filteredNews[3].category}</div>
                                            <h3 className="text-lg font-bold text-white line-clamp-2 leading-snug group-hover:text-orange-300 transition-colors">{filteredNews[3].title}</h3>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Remaining Grid */}
                        {filteredNews.length > 4 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-10">
                                <AnimatePresence>
                                    {filteredNews.slice(4).map((article, idx) => (
                                        <motion.div
                                            key={article.id}
                                            layout
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
                                            onClick={() => { if (article.link) window.open(article.link, '_blank'); }}
                                            className="group relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] hover:bg-white/10 hover:border-blue-500/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-500 cursor-pointer flex flex-col overflow-hidden"
                                        >
                                            {/* Glowing background blob on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-colors duration-500 z-0"></div>

                                            {/* Thumbnail */}
                                            <div className="relative h-64 overflow-hidden p-3 pb-0 z-10">
                                                <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                                                    <img
                                                        src={article.imageUrl}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                                    />
                                                    <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg">
                                                        {article.category}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 md:p-8 flex flex-col flex-1 z-10">
                                                <h3 className="text-xl md:text-2xl font-black text-gray-100 mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all leading-snug">
                                                    {article.title}
                                                </h3>
                                                <p className="text-sm text-gray-400 line-clamp-3 mb-6 flex-1 font-medium leading-relaxed group-hover:text-gray-300 transition-colors">
                                                    {article.summary}
                                                </p>

                                                <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/5">
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-wider">
                                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" /> {article.date}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                        <span>{article.readTime} p</span>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-400 group-hover:text-white transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                                        <ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 relative z-10">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                            <Newspaper className="w-10 h-10 opacity-50" />
                        </div>
                        <p className="text-xl font-bold">Không có bài báo nào trong danh mục này.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
