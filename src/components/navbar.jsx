import React from 'react'

const navbar = () => {
  return (
    <div>
  <nav className="bg-black">
    <div className="container mx-auto h-12 flex items-center justify-between px-4">
      <h1 className="text-4xl font-bold text-white mt-10 cursor-pointer">
        Todo <span className="text-orange-400">List</span>
      </h1>
    </div>
  </nav>
</div>
  )
}

export default navbar