export default function LoginPage() {
  return (
    <div className="flex h-screen">
      
      {/* 왼쪽 (이미지 영역) */}
      <div className="hidden md:flex w-1/2 bg-gray-100 items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">H-AI Grad</h1>
          <p className="text-gray-500">대학원 준비 플랫폼</p>
        </div>
      </div>

      {/* 오른쪽 (로그인 폼) */}
      <div className="flex w-full md:w-1/2 items-center justify-center">
        <div className="w-[350px]">

          {/* 타이틀 */}
          <h2 className="text-xl font-semibold mb-6 leading-snug">
            대학원 준비, <br />
            한 곳에서 끝내는 H-AI Grad
          </h2>

          {/* 폼 */}
          <form className="flex flex-col gap-4">
            
            {/* 이메일 */}
            <div>
              <label className="text-sm mb-1 block">이메일</label>
              <input
                type="email"
                placeholder="이메일을 입력해주세요."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="text-sm mb-1 block">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력해주세요."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="bg-gray-400 text-white py-3 rounded-lg mt-2 hover:bg-blue-500 transition"
            >
              로그인
            </button>
          </form>

          {/* 회원가입 */}
          <p className="text-center text-sm mt-6 text-gray-500">
            아직 회원이 아니신가요?
          </p>

        </div>
      </div>
    </div>
  );
}