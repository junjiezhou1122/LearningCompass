export default function Hero() {
  return (
    <section className="relative rounded-2xl overflow-hidden mb-12 bg-gradient-to-r from-[#f8fafc] to-[#eef2ff]">
      <div className="container mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between">
        {/* Left side content */}
        <div className="md:w-1/2 z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-5 text-gray-800 leading-tight">
            Discover Your <span className="text-[#4264f0]">Learning Path</span>
          </h1>
          <p className="text-lg mb-4 text-gray-600 max-w-md">
            Personalized recommendations to help you advance your skills and career.
          </p>
        </div>
        
        {/* Right side design element */}
        <div className="md:w-1/2 flex justify-center mt-8 md:mt-0">
          <div className="relative">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#4264f0]/10 rounded-full"></div>
            <div className="absolute bottom-6 -left-6 w-24 h-24 bg-[#4264f0]/20 rounded-full"></div>
            <div className="relative bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                Learn<span className="text-[#4264f0]">.</span>Grow<span className="text-[#4264f0]">.</span>Succeed
              </h2>
              <div className="mt-4 w-20 h-1.5 bg-[#4264f0] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
