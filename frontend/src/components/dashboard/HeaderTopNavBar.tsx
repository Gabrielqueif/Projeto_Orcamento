import React from "react";

// Image assets (replace with actual paths or import if stored locally)
const imgPerfil = "http://localhost:3845/assets/ddf8e063c48711bbe990688e9bd0f1630ce4eb6a.png";
const imgIcon = "http://localhost:3845/assets/a7fdf18e6135cd9a926e94d44b65be2419aa99b8.svg";
const imgContainer = "http://localhost:3845/assets/7c39912ee9518163d33e05e469679ec06d2fb520.svg";
const imgContainer1 = "http://localhost:3845/assets/981d53d9f09709eaa676574d6d1601c5d6a9e463.svg";

export default function HeaderTopNavBar() {
  return (
    <div className="bg-white border-[#d1d5db] border-b border-solid content-stretch flex items-center justify-between pb-px px-[32px] relative size-full" data-node-id="2348:3847" data-name="Header - TopNavBar">
      <div className="flex-[1_0_0] min-w-px relative" data-node-id="2348:3848" data-name="Container">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pr-[214.5px] relative size-full">
          <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[448px] min-w-px relative" data-node-id="2348:3849" data-name="Container">
            <div className="bg-[#f8fafc] border border-[#d1d5db] border-solid content-stretch flex items-start justify-center overflow-clip pb-[11px] pl-[41px] pr-[17px] pt-[10px] relative rounded-[8px] shrink-0 w-full" data-node-id="2348:3850" data-name="Input">
              <div className="flex-[1_0_0] min-w-px relative" data-node-id="2348:3851" data-name="Container">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
                  <div className="[word-break:break-word] flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#6b7280] text-[14px] w-full" data-node-id="2348:3852">
                    <p className="leading-[normal]">Buscar obras, arquivos ou tarefas...</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-[26.32%] left-[15px] top-[26.32%] w-[18px]" data-node-id="2348:3853" data-name="Icon">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIcon} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative shrink-0" data-node-id="2348:3854" data-name="Container">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[24px] items-center relative size-full">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="2348:3855" data-name="Container">
            <div className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[9999px] shrink-0" data-node-id="2348:3856" data-name="Button">
              <div className="h-[20px] relative shrink-0 w-[16px]" data-node-id="2348:3857" data-name="Container">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer} />
              </div>
              <div className="absolute bg-[#ef4444] border-2 border-solid border-white right-[7.98px] rounded-[9999px] size-[8px] top-[8px]" data-node-id="2348:3859" data-name="Background+Border" />
            </div>
            <div className="content-stretch flex flex-col items-center justify-center p-[8px] relative rounded-[9999px] shrink-0" data-node-id="2348:3860" data-name="Button">
              <div className="relative shrink-0 size-[20px]" data-node-id="2348:3861" data-name="Container">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer1} />
              </div>
            </div>
          </div>
          <div className="bg-[#d1d5db] h-[32px] relative shrink-0 w-px" data-node-id="2348:3863" data-name="Vertical Divider" />
          <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="2348:3864" data-name="Container">
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-[108.47px]" data-node-id="2348:3865" data-name="Container">
              <div className="content-stretch flex flex-col items-end relative shrink-0 w-full" data-node-id="2348:3866" data-name="Container">
                <div className="[word-break:break-word] flex flex-col font-['Inter:Bold'] font-bold h-[14px] justify-center leading-[0] not-italic relative shrink-0 text-[#001b3c] text-[14px] text-right w-[103.05px]" data-node-id="2348:3867">
                  <p className="leading-[14px]">Carlos Mendes</p>
                </div>
              </div>
              <div className="content-stretch flex flex-col items-end relative shrink-0 w-full" data-node-id="2348:3868" data-name="Container">
                <div className="[word-break:break-word] flex flex-col font-['Inter:Bold'] font-bold h-[15px] justify-center leading-[0] not-italic relative shrink-0 text-[10px] text-[rgba(0,27,60,0.6)] text-right tracking-[1px] uppercase w-[108.47px]" data-node-id="2348:3869">
                  <p className="leading-[15px]">Gestor de Obras</p>
                </div>
              </div>
            </div>
            <div className="border-2 border-[#9fd300] border-solid relative rounded-[9999px] shrink-0 size-[40px]" data-node-id="2348:3870" data-name="Perfil">
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[9999px]">
                <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgPerfil} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
