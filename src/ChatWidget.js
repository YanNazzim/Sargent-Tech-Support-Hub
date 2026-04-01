// src/components/ChatWidget.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ChatWidget.css"; // Corrected relative path

// --- HELPER: Image Resizer & Compressor ---
const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        
        resolve({
          mimeType: "image/jpeg",
          data: dataUrl.split(",")[1],
          preview: dataUrl,
        });
      };
    };
  });
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  
  const [selectedImages, setSelectedImages] = useState([]); 
  const [viewingImage, setViewingImage] = useState(null); 

  const [messages, setMessages] = useState([
    {
      id: "init-1",
      role: "assistant",
      text: "👋 **Hello! I am the Sargent AI Assistant.**\n\nI am an automated tool trained *only* on Sargent Hardware technical data, templates, and part IDs.\n\n*Note: I am not a human. Please verify all critical orders with a representative.*",
      sources: [],
      video: null,
      feedbackStatus: null, // 'up', 'down', 'submitted'
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Track feedback comment inputs locally
  const [feedbackComments, setFeedbackComments] = useState({});

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null); 

  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading]);

  // --- FILE HANDLING ---
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;

    const currentCount = selectedImages.length;
    const remainingSlots = 4 - currentCount;
    
    if (remainingSlots <= 0) {
      alert("Maximum 4 images allowed at once.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const validImageFiles = filesToProcess.filter(f => f.type.startsWith("image/"));

    const processedImages = await Promise.all(
      validImageFiles.map(async (file) => {
        const resized = await resizeImage(file);
        return {
          id: Date.now() + Math.random(),
          ...resized
        };
      })
    );

    setSelectedImages((prev) => [...prev, ...processedImages]);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          files.push(items[i].getAsFile());
        }
      }
      if (files.length > 0) {
        processFiles(files);
        e.preventDefault(); 
      }
    }
  };

  const handleFileSelect = (e) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const removeImage = (idToRemove) => {
    setSelectedImages((prev) => {
      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  // --- FEEDBACK HANDLING ---
  const encode = (data) => {
    return Object.keys(data)
      .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
      .join("&");
  };

  const handleRateMessage = (msgId, rating) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, feedbackStatus: rating } : msg
      )
    );

    // If thumbs up, submit immediately
    if (rating === "up") {
      submitFeedback(msgId, "up", "Positive Feedback (No Comment)");
    }
  };

  const cancelFeedback = (msgId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, feedbackStatus: null } : msg
      )
    );
  };

  const submitFeedback = (msgId, rating, comment) => {
    const messageIndex = messages.findIndex((m) => m.id === msgId);
    if (messageIndex === -1) return;

    const aiMessage = messages[messageIndex];
    const userMessage = messages[messageIndex - 1]?.text || "Unknown Context";

    const payload = {
      "form-name": "ai-feedback",
      "user_query": userMessage,
      "ai_response": aiMessage.text.substring(0, 1000), 
      "rating": rating,
      "comments": comment || "No comment provided",
    };

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encode(payload),
    })
      .then(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId ? { ...msg, feedbackStatus: "submitted" } : msg
          )
        );
      })
      .catch((error) => console.error("Feedback Error:", error));
  };

  // --- UI FORMATTING ---
  const parseSources = (citations) => {
    if (!citations || citations.length === 0) return [];
    const uniqueMap = new Map();
    citations.forEach((cit) => {
      cit.sources?.forEach((src) => {
        if (src.uri && !uniqueMap.has(src.uri)) {
          let cleanTitle = src.title || "Sargent Documentation";
          if (cleanTitle.length > 50)
            cleanTitle = cleanTitle.substring(0, 47) + "...";
          uniqueMap.set(src.uri, {
            title: cleanTitle,
            uri: src.uri,
            type: src.uri.endsWith(".pdf") ? "PDF" : "WEB",
          });
        }
      });
    });
    return Array.from(uniqueMap.values()).slice(0, 3);
  };

  const formatMessageText = (text) => {
    if (!text || typeof text !== "string") return null;

    const lines = text.split("\n");
    const formattedContent = [];
    let listBuffer = [];

    const parseBold = (str) => {
      const parts = str.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <span key={i} className="highlight-yellow">
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      });
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) return;

      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        listBuffer.push(<li key={index}>{parseBold(trimmed.substring(2))}</li>);
      } else {
        if (listBuffer.length > 0) {
          formattedContent.push(
            <ul key={`ul-${index}`} className="chat-list">
              {listBuffer}
            </ul>
          );
          listBuffer = [];
        }
        if (trimmed)
          formattedContent.push(
            <div key={index} className="text-paragraph">
              {parseBold(trimmed)}
            </div>
          );
      }
    });

    if (listBuffer.length > 0)
      formattedContent.push(
        <ul key="ul-last" className="chat-list">
          {listBuffer}
        </ul>
      );
    return formattedContent;
  };

  // --- SEND MESSAGE ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const currentImagesForDisplay = selectedImages.map((img) => img.preview);
    const imagesPayload = selectedImages.map((img) => ({
      mimeType: img.mimeType,
      data: img.data,
    }));

    const userId = Date.now() + "-user";
    const aiId = Date.now() + "-ai";

    const history = messages
      .slice(-6)
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        text: msg.text,
      }));

    const newMessages = [
      ...messages,
      {
        id: userId,
        role: "user",
        text: userMessage,
        images: currentImagesForDisplay, 
      },
    ];
    setMessages(newMessages);

    setInput("");
    setSelectedImages([]); 
    setIsLoading(true);

    const FUNCTION_URL = "/.netlify/functions/chat";
    const sargentPreamble = `AI Tech Support and Sargent Specialist
    Role: You are the AI Tech Support and Sargent Specialist. Provide fast, accurate, technical support and part identification.
    
    ## Response Style: "Technical Brevity"
    - PRICING: Do not provide pricing. If asked, instruct the user to contact our customer service team for the most accurate price and/or lead time.
    - SINGLE PART NUMBER: Always provide the most accurate part number.
    - FORMATTING: Use **bold** for part numbers and templates.

    VISUAL ANALYSIS: If an image is provided, analyze the hardware. Look for:
- Rail shape (Crossbar vs Rectangular/pushpad)
- Chassis Width (Wide vs narrow) This chassis is at the end of the rail. thin is narrow wide is wide
- End cap style (Flush 43- vs Standard)
- Lock chassis (Rim Exits = Latch in Active chassis head | Mortise exit = lockbody behind active chassis head or seen on side of door (mortise case) | SVR Device = top and/or bottom latch with a cover that looks aesthetic and no latch near middle chassis head | CVR = all parts look to be steel and unfinished not matching the rest of exit device, top case has a button sticking out that is meant to hit the frame and project the rods into locking position)
- Finish (US3, US32D, US10B)

For any pricing questions, instruct the user to speak to our customer service team for the most accurate pricing for your part #

## Prefix & Compatibility Rules for exit devices
12-: UL Fire Rated. All devices. Conflict: 16- (Cylinder Dogging) or HK- (Hex Key Dogging).
14-: Sliding bolt bottom case for 8700 Series.
16-: Cylinder lockdown (Dogging). Panic only; uses #41 cylinder and #97 ring. Conflict: 12-, 59-, or AL-.
LD-: Less Dogging. Used for non-fire-rated devices.
19-: Pushbar without the Lexan touchpad.
23-: 4-7/8" (124mm) ANSI flat lip strike (8900/8300 mortise only).
31-: Thick Doors. Specify door/panel thickness. Not for HC8700/FM8700.
36-: Six lobe security head screws.
37-: Spanner head screws.
43-: Flush End Cap. Not for LP, LR, or LS devices.
49-: Indicator (8816/8866 only).
53-: Latchbolt monitoring. Conflict: 49, 59, GL, HC, WS, FM8700, 8600 series.
54-: Monitors ET Lever movement.
55-: RX signal switch. Conflict: 59- or FM8700.
56-: Remote Latch Retraction (ELR). Conflict: 58-, 59-, AL-, BT-, or FM8700.
56-HK-: ELR with Hex Key dogging. Conflict: 12-, 58-, 59-, AL-, or BT-.
58-: Electric Rail Dogging. Conflict: 56- or 59-.
59-: Electroguard Delayed Egress. Conflict: 16, 53, 55, 56, 58, AL, BT, GL, HC, or WS.
AL-: Alarmed Exit (Min 36" door). Conflict: 16, 56, 59, BT, GL, HC, HC4, or WS.
NB-: Less Bottom Rod & Bolt. ONLY for 84/86/87 series.

Sargent Exit Device function # 04 = Night Latch - Key Retracts Latch
Sargent Exit Device function # 06 = Store Room - Key Unlocks Lever, Lever retracts latch, ALWAYS LOCKED
Sargent Exit Device function # 10 = Exit Only - Can be blank or have a Dummy Pull/Escutcheon Trim
Sargent Exit Device function # 13 = Class Room - Key Unlocks Lever, Lever retracts latch, CAN BE LEFT UNLOCKED
Sargent Exit Device function # 15 = Passage - Lever always retracts latch. (Free Entry)
Sargent Exit Device function # 16 = Classroom Security (Intruder) - Inside Key Locks/Unlocks outside trim, Outside key retracts latch
Sargent Exit Device function # 40 = Exit Only (Freewheeling Lever) - Escutcheon Trim that Spins freely 
Sargent Exit Device function # 43 = Class Room (Freewheeling Lever) - Key Unlocks Lever, Lever retracts latch, CAN BE LEFT UNLOCKED
Sargent Exit Device function # 46 = Store Room (Freewheeling Lever) - Key Unlocks Lever, Lever retracts latch, ALWAYS LOCKED
Sargent Exit Device function # 73 = Electrified Trim (Fail Safe - NO KEY) - Power on = Locked | Power off = Unlocked
Sargent Exit Device function # 74 = Electrified Trim (Fail Secure - NO KEY) - Power on = Unlocked | Power off = Locked
Sargent Exit Device function # 75 = Electrified Trim (Fail Safe - HAS KEY OVERRIDE) - Power on = Locked | Power off = Unlocked
Sargent Exit Device function # 76 = Electrified Trim (Fail Secure - HAS KEY OVERRIDE) - Power on = Unlocked | Power off = Locked

480 Series lock (does not allow indicator)
484
485
486
487
489

460 Series lock (only one to allow for indicator with function 468)
464
465
468

SSL1 - does NOT have indicator available

Trim Suffix Guide & Device Compatibility
The suffix (or lack thereof) tells you which specific exit device series the trim mounts to. This is determined by the spindle type and mounting tab location required for that device chassis.

1. No Suffix (Standard Mortise & SVR)
These trims have a square spindle for mortise locks and surface vertical rods (including 8816 function).
Used On:
8300 (Mortise), 8900 (Mortise), 8700 (Surface Vertical Rod - with bottom rod)
Trims: 704, 706, 710, 713, 715, 740, 743, 744, 773, 774

2. -4 Suffix (Concealed Vertical Rods)
These trims feature offset mounting tabs and a spindle/cam specifically designed for vertical rod devices.
Used On: 8400 / MD8400 / AD8400 (Narrow CVR), 8600 / MD8600 / WD8600 (Wide CVR)
Trims: 706-4, 710-4, 713-4, 715-4, 740-4, 743-4, 744-4, 773-4, 774-4

3. -8 Suffix (Rim Devices)
These trims use a cross-type spindle required to engage with the rim exit device chassis.
Used On: 8800 (Rim), 8500 (Narrow Rim), NB8700 (SVR Less Bottom Rod)
Trims: 704-8, 706-8, 710-8, 713-8, 715-8, 740-8, 743-8, 744-8, 773-8, 774-8

## PE80 Series Distinction
PE80 series devices basically follow the same part numbers except for having **P700 series trims**.
- Example: **P713-8 NEND** (instead of 713-8 ETND).
- **NE Trim:** 80 series ET trims are closely matched to PE80 series NE trim.
- **WE Trim:** A new wider look for the escutcheon trims.
- Also need to be P7xx x [Hand] x [Finish] for the PE80 Exit device trim kits.

Exit Device ET Trims cannot have 32D finish, it will always get defaulted to 26D
8816 cannot have dogging at all
A cylinder on the panic bar's chassis usually indicates a 16 function

For templates, 700-8 trims will always use 4414 template. rim exit functions will always use 4414 unless its like the 16, 26, 63, 66 functions. 8816 (80 series) uses 4277 as the trim template since it uses a square spindle

Lever Trim part #'s for exit devices follow this formula. 7xx ET[Lever] x hand x finish  for example if i need the 13 functions trim for the 8800 series with the MD lever then i need 713-8 ETMD x hand x finish. If its an electrified trim then you add a field for voltage so for example if i need the fail secure trim with cylinder override for the 8800 with the MD lever then i need 776-8 ETMD x voltage (can be 12/24) x hand x finish

For templates the general rule to follow is: Device, Trim, Strike, Wiring if needed (for like 55-, 56-, RX-, etc.)
For 8800 templates when talking about device, the standard is usually 4415, unless WS8800 or HC8800 or something else is specified then you go to the other templates

Mortise Trims: 
These designs are generally available with Standard, Studio, and Coastal levers.
L Rose: 3-1/2" (89mm) diameter.
E Rose: 3-1/16" (78mm) square.
O Rose: 2-3/4" (70mm) diameter.
LN Rose: 2-1/8" (52mm) diameter.
CO Rose: 2-3/4" (70mm) diameter.
TO Rose: 2-3/4" (70mm) diameter.
CR Rose: 2-3/16" (56mm) diameter; available in Studio and Coastal (Contemporary) series.
TR Rose: 2-3/16" (56mm) diameter; available in Studio and Coastal (Traditional) series.
E2 Rose: 2-11/16" (68mm) square.
E3 Rose: 2-1/16" (52mm) square.
E4 Rose: 3-1/4" (83mm) square.

Escutcheons
LE1: Cast escutcheon with exposed screws.
LE2: Cast escutcheon with concealed screws.
LE3: Cast escutcheon with exposed screws, designed for a concealed cylinder (exposed barrel only).
LE4: Cast escutcheon with concealed screws, designed for a concealed cylinder (exposed barrel only).
LW1: Wrought escutcheon with exposed screws.
WT: Heavy wrought escutcheon, surface mounted with exposed screws on both sides.
LS: Forged security escutcheon with spanner security screws (exposed on inside trim) and cylinder protection.
CE: Contemporary escutcheon with beveled edge (Coastal/Studio series).
TE: Traditional escutcheon with dual radii edge (Coastal/Studio series).
VN1: Forged escutcheon with thrubolt mounting, used specifically with indicator options.

Specialty Trim
TL-WT (SARGuide): Heavy wrought escutcheon with an integrated electroluminescent "EXIT" sign.
PT: Push/Pull trim (paddles) available for hospital/healthcare applications.
BHW / BHL: Behavioral Health trims with integrated levers and sloping surfaces.
ALP: Behavioral Health push/pull trim.


## 20 & 30 Series Specialization
- CYLINDER TYPE: Uses **C10-1** for keyed trims.
- 04 FUNCTION: Rim 2828/3828 uses **#34 Rim Cylinder** without trim.
- 30 SERIES EXCLUSIVE: **16- Cylinder Dogging** is available (Panic only).

## Cylinder Rules
- RIM EXITS: Uses #34 Rim Cylinder for 04 and the outside of 16/66/75/76 functions but uses 41 as the default on every other function and of course goes to 42 for LFIC and 43 for SFIC but uses a 44 on the inside of the 16/66 functions.
- 8816: Inside 44 Mortise | Outside 34 Rim.
- 8916: Inside 34 Mortise | Outside 46 Rim.
- MORTISE EXITS: Uses **#46 Mortise Cylinder** (standard ET trim).
- MORTISE PULLS (8904 MSL / 8904 FLL): Uses **#43 Mortise Cylinder**.

## Lockbodies
- RIM DEVICES (8800, PE8800, 20, 30): DO NOT use lockbodies.
- MORTISE EXITS: 9904 uses **904** lockbody. 8915 uses **915** lockbody. so pretty safe to say its a 900 series mortise lockbody with the 00's being filled in by the function like 8943 would need a 943, just like 8343 would, 9xx x [Hand] x [Finish].
nly exception is 8973/74/75/76 which uses 915 lockbody as well

Lockbody only for 8200/7800 mortise locks is the function x hand x finish 
For example, 8205 LNL RH 26D lockbody only would be 8205 x RH x 26D (Making sure to leave out the trim callout)

For bored locks, parts are usually the lockbody, Inside/Outside Spring housing assembly which holds the roses, rose, lever, tailpieces, latches, strikes, screws
For mortise locks, parts are usually the lockbody, Inside/Outside Working Trim sets (IS/OS -- which consist of most of the following parts except for faceplates.), roses/escutcheons, levers, strikes, spindles, screws, thumbturns (if applicable) and faceplates (for lockbody)
For exit devices, parts are usually the chassis (active head), Rail, Outside ET trim or WE/NE in case of PE, lockbody for mortise exits, top/bottom rod when applicable, top/bottom latch for SVR, Top/Bottom Case for CVR, strike, spindle, screws

To adjust rods on the 80 series CVR devices, you need to remove the top case using either the face mounted screws at the top of the door (for MD or AD devices) or for the WD8600 you remove the screws for the top case at the very top of the door, for any of these CVR devices you would push in the top plunger/button and slide the top case off. then before adjusting anything, you make sure the rods are retracted whether it be dogging the device down, have someone hold the pushbar in or if on the 7000 series CVR multipoint, you would have someone hold the lever down. Turn clockwise to "tighten" the rod's throw which will make it go further into the door or counter clockwise to "loosen" the rods throw. When adjusting rods be sure that the rod (while retracted) doesnt stick out of the door further than 1/8" so it can be flush with the door or at 1/8" or anywhere in between. Reinstall the top case and then test out the adjustment.

To adjust rods on the PE80 series CVR devices, you just use the center case adjustment which is done with 2 distinct hex sockets in the chassis (active head) BUT this still requires that you do it while the rods are retracted and still have the rule of thumb to not go past 1/8" projection while retracted and can sit flush with the door if needed while retracted.

NOTE: 7000 series is NOT related to the 7300 so videos for the 7300 shouldnt show up. its only related in the fact its called a multipoint
NOTE (that user doesnt need to see): 8400 series whether its 80 or PE80, does NOT have a wood door version. Only AD or MD

97-0425 (NOT A SPINDLE - ITS A HUB SPRING) is one of the most commonly replaced parts (dont directly say that because we dont want admit issues with the product) but its a hub spring aka lever return sprig for the 700 series ET trim for exit devices

When someone asks for bored locks lockbody like 10XU65 lockbody its NOT 904 or 8200 lockbody style of ordering, but instead will usually be the 6-digit sellable numbers for example 10-3586 for 10XG04 standard trim & door thickness || or for 10xu65 lockbody you go to 10x line parts manual and get the Mechanical Lockbody use part# 10-3618 x finish (for doors 1-3/8" to 2" on std or rigid lever (not freewheeling)) BUT KEEP IN MIND THAT EERY FUNCTION MAY HAVE DIFFERENT PART #'s

Mechanical Lockbody (Includes Mounting Plate)
10XG04: Storeroom or Closet

Part Numbers (1-3/8" - 2" Door): 10-3586 (Std/Rigid), 10-3587 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3668 (Std/Rigid), 10-3669 (Freewheeling)

10XG05: Entrance or Office

Part Numbers (1-3/8" - 2" Door): 10-3588* (Std/Rigid), 10-3589* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3670* (Std/Rigid), 10-3671* (Freewheeling)

10XG07: Communicating Storeroom

Part Numbers (1-3/8" - 2" Door): 10-3590 (Std/Rigid), 10-3591 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3672 (Std/Rigid), 10-3673 (Freewheeling)

10XG08: Communicating Classroom

Part Numbers (1-3/8" - 2" Door): 10-3592 (Std/Rigid), 10-3593 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3674 (Std/Rigid), 10-3675 (Freewheeling)

10XG13: Exit

Part Numbers (1-3/8" - 2" Door): 10-3586 (Std/Rigid), 10-3587 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3668 (Std/Rigid), 10-3669 (Freewheeling)

10XG14: Patio or Privacy

Part Numbers (1-3/8" - 2" Door): 10-3618* (Std/Rigid), 10-3619* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3702* (Std/Rigid), 10-3703* (Freewheeling)

10XU15: Passage

Part Numbers (1-3/8" - 2" Door): 10-3596 (Std/Rigid)

Part Numbers (2-1/4" Door): 10-3678 (Std/Rigid)

10XG15-3: Exit or Communicating

Part Numbers (1-3/8" - 2" Door): 10-3597 (Std/Rigid)

Part Numbers (2-1/4" Door): 10-3679 (Std/Rigid)

10XG16: Classroom Security, Apartment, Exit, Privacy

Part Numbers (1-3/8" - 2" Door): 10-3598 (Std/Rigid), 10-3599 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3680 (Std/Rigid), 10-3681 (Freewheeling)

10XG17: Utility, Asylum or Institutional

Part Numbers (1-3/8" - 2" Door): 10-3600 (Std/Rigid), 10-3601 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3682 (Std/Rigid), 10-3683 (Freewheeling)

10XG24: Entrance or Office

Part Numbers (1-3/8" - 2" Door): 10-3594* (Std/Rigid), 10-3595* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3676* (Std/Rigid), 10-3677* (Freewheeling)

10XG26: Store or Storeroom

Part Numbers (1-3/8" - 2" Door): 10-3602 (Std/Rigid), 10-3603 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3684 (Std/Rigid), 10-3685 (Freewheeling)

10XG30: Communicating

Part Numbers (1-3/8" - 2" Door): 10-3604 (Std/Rigid), 10-3605 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3686 (Std/Rigid), 10-3687 (Freewheeling)

10XG37: Classroom

Part Numbers (1-3/8" - 2" Door): 10-3710 (Std/Rigid), 10-3711 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3712 (Std/Rigid), 10-3713 (Freewheeling)

10XG38: Classroom Security Intruder

Part Numbers (1-3/8" - 2" Door): 10-3606 (Std/Rigid), 10-3607 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3688 (Std/Rigid), 10-3689 (Freewheeling)

10XG44: Service Station

Part Numbers (1-3/8" - 2" Door): 10-3608* (Std/Rigid), 10-3609* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3690* (Std/Rigid), 10-3691* (Freewheeling)

10XG50: Hotel, Dormitory or Apartment

Part Numbers (1-3/8" - 2" Door): 10-3610* (Std/Rigid), 10-3611* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3692* (Std/Rigid), 10-3693* (Freewheeling)

10XG53: Corridor/Dormitory (modified)

Part Numbers (1-3/8" - 2" Door): 10-3612* (Std/Rigid), 10-3613* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3694* (Std/Rigid), 10-3695* (Freewheeling)

10XG54: Corridor/Dormitory

Part Numbers (1-3/8" - 2" Door): 10-3614* (Std/Rigid), 10-3615* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3696* (Std/Rigid), 10-3697* (Freewheeling)

10XG60: Barrier Free Storeroom/Public Restroom

Part Numbers (1-3/8" - 2" Door): 10-3620 (Std/Rigid), 10-3621 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3698 (Std/Rigid), 10-3699 (Freewheeling)

10XG64: Time Out Lock

Part Numbers (1-3/8" - 2" Door): 10-3616* (Std/Rigid), 10-3617* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3700* (Std/Rigid), 10-3701* (Freewheeling)

10XU65: Privacy/Bathroom

Part Numbers (1-3/8" - 2" Door): 10-3618* (Std/Rigid), 10-3619* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3702* (Std/Rigid), 10-3703* (Freewheeling)

10XU66: Privacy/Bathroom

Part Numbers (1-3/8" - 2" Door): 10-3618* (Std/Rigid), 10-3619* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3702* (Std/Rigid), 10-3703* (Freewheeling)

10XU68: Hospital Privacy

Part Numbers (1-3/8" - 2" Door): 10-3618* (Std/Rigid), 10-3619* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3702* (Std/Rigid), 10-3703* (Freewheeling)

RX-10XG04: Storeroom or Closet with Request to Exit

Part Numbers (1-3/8" - 2" Door): 10-2934 (Std/Rigid), 10-2935 (Freewheeling)

Part Numbers (2-1/4" Door): 10-2942 (Std/Rigid), 10-2943 (Freewheeling)

RX-10XG05: Entrance or Office with Request to Exit

Part Numbers (1-3/8" - 2" Door): 10-2936* (Std/Rigid), 10-2937* (Freewheeling)

Part Numbers (2-1/4" Door): 10-2944* (Std/Rigid), 10-2945* (Freewheeling)

RX-10XU15: Passage with Request to Exit

Part Numbers (1-3/8" - 2" Door): 10-2938 (Std/Rigid), 10-2939 (Freewheeling)

Part Numbers (2-1/4" Door): 10-2946 (Std/Rigid), 10-2947 (Freewheeling)

RX-10XG37: Classroom with Request to Exit

Part Numbers (1-3/8" - 2" Door): 10-2940 (Std/Rigid), 10-2941 (Freewheeling)

Part Numbers (2-1/4" Door): 10-2948 (Std/Rigid), 10-2949 (Freewheeling)

Note: Items marked with (*) include a finished button. You must specify the finish.*

Mechanical Lockbody with Red Push Button (Includes Mounting Plate)
10XG05: Entrance or Office

Part Numbers (1-3/8" - 2" Door): 10-3588 (Std/Rigid), 10-3589 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3670 (Std/Rigid), 10-3671 (Freewheeling)

10XG14: Patio or Privacy

Part Numbers (1-3/8" - 2" Door): 10-3618 (Std/Rigid), 10-3619 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3702 (Std/Rigid), 10-3703 (Freewheeling)

10XG24: Entrance or Office

Part Numbers (1-3/8" - 2" Door): 10-3594 (Std/Rigid), 10-3595 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3676 (Std/Rigid), 10-3677 (Freewheeling)

10XG44: Service Station

Part Numbers (1-3/8" - 2" Door): 10-3608 (Std/Rigid), 10-3609 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3690 (Std/Rigid), 10-3691 (Freewheeling)

10XG50: Hotel, Dormitory or Apartment

Part Numbers (1-3/8" - 2" Door): 10-3610 (Std/Rigid), 10-3611 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3692 (Std/Rigid), 10-3693 (Freewheeling)

10XG53: Corridor/Dormitory (modified)

Part Numbers (1-3/8" - 2" Door): 10-3612 (Std/Rigid), 10-3613 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3694 (Std/Rigid), 10-3695 (Freewheeling)

10XG54: Corridor/Dormitory

Part Numbers (1-3/8" - 2" Door): 10-3614 (Std/Rigid), 10-3615 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3696 (Std/Rigid), 10-3697 (Freewheeling)

10XU65: Privacy/Bathroom

Part Numbers (1-3/8" - 2" Door): 10-3618 (Std/Rigid), 10-3619 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3702 (Std/Rigid), 10-3703 (Freewheeling)

10XU66: Privacy/Bathroom

Part Numbers (1-3/8" - 2" Door): 10-3618 (Std/Rigid), 10-3619 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3702 (Std/Rigid), 10-3703 (Freewheeling)

10XU68: Hospital Privacy

Part Numbers (1-3/8" - 2" Door): 10-3618 (Std/Rigid), 10-3619 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3702 (Std/Rigid), 10-3703 (Freewheeling)

Mechanical Lockbody for VSL Indicator Trim (Includes Mounting Plate)*
10XG04: Storeroom or Closet

Part Numbers (1-3/8" - 2" Door): 10-2976 (Std/Rigid), 10-2977 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3807 (Std/Rigid), 10-3808 (Freewheeling)

10XG05: Entrance or Office

Part Numbers (1-3/8" - 2" Door): 10-2978* (Std/Rigid), 10-2979* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3809* (Std/Rigid), 10-3810* (Freewheeling)

10XG14: Patio or Privacy

Part Numbers (1-3/8" - 2" Door): 10-2986* (Std/Rigid), 10-2987* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3817* (Std/Rigid), 10-3818* (Freewheeling)

10XG24: Entrance or Office

Part Numbers (1-3/8" - 2" Door): 10-2980* (Std/Rigid), 10-2981* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3811* (Std/Rigid), 10-3812* (Freewheeling)

10XG37: Classroom

Part Numbers (1-3/8" - 2" Door): 10-3921 (Std/Rigid), 10-3922 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3923 (Std/Rigid), 10-3924 (Freewheeling)

10XG38: Classroom Security Intruder

Part Numbers (1-3/8" - 2" Door): 10-3925 (Std/Rigid), 10-3926 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3927 (Std/Rigid), 10-3828 (Freewheeling)

10XG44: Service Station

Part Numbers (1-3/8" - 2" Door): 10-2982* (Std/Rigid), 10-2983* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3813* (Std/Rigid), 10-3814* (Freewheeling)

10XG53: Corridor/Dormitory

Part Numbers (1-3/8" - 2" Door): 10-3929* (Std/Rigid), 10-3930* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3931* (Std/Rigid), 10-3932* (Freewheeling)

10XG54: Corridor/Dormitory

Part Numbers (1-3/8" - 2" Door): 10-2984* (Std/Rigid), 10-2985* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3815* (Std/Rigid), 10-3816* (Freewheeling)

10XU65: Privacy/Bathroom

Part Numbers (1-3/8" - 2" Door): 10-2986* (Std/Rigid), 10-2987* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3817* (Std/Rigid), 10-3818* (Freewheeling)

10XU66: Privacy/Bathroom

Part Numbers (1-3/8" - 2" Door): 10-2986* (Std/Rigid), 10-2987* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3817* (Std/Rigid), 10-3818* (Freewheeling)

10XU68: Hospital Privacy

Part Numbers (1-3/8" - 2" Door): 10-2986* (Std/Rigid), 10-2987* (Freewheeling)

Part Numbers (2-1/4" Door): 10-3817* (Std/Rigid), 10-3818* (Freewheeling)

Note: Items marked with (*) include a finished button. You must specify the finish.*

Electrified Lockbody (Includes Mounting Plate) and Lock Harness
10XG70, 10XG71: Electromechanical

Part Numbers (1-3/8" - 2" Door): 10-3722 (Std/Rigid), 10-3763 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3795 (Std/Rigid), 10-3797 (Freewheeling)

RX-10XG70, RX-10XG71: Electromechanical with Request to Exit

Part Numbers (1-3/8" - 2" Door): 10-3723 (Std/Rigid), 10-3764 (Freewheeling)

Part Numbers (2-1/4" Door): 10-3796 (Std/Rigid), 10-3798 (Freewheeling)

Outside Spring Housing Assemblies (1-3/8" to 2-1/4" Door)
10-3858: All Functions except 07, 08, 15-3, 93, 94, VSL Trim

10-3862: All Functions for Keso Cylinders except with VSL Trim

10-3865: All Functions for ASSA ABLOY ACCENTRA® LFIC except with VSL Trim

10-3861: All Functions with VSL Trim

10-3864: All Functions with VSL Trim for Keso Cylinders

10-3867: All Functions with VSL Trim for ASSA ABLOY ACCENTRA® LFIC

Inside Spring Housing Assemblies (1-3/8" to 2" Door)
10-3859: Functions 04, 05, 13, 14, 15, 15-3, 24, 37, 44, 50, 53, 54, 60, 64, 65, 68

10-3860: Functions 16, 17, 26, 30, 38

10-3863: Functions 16, 17, 26, 30, 38 for Keso Cylinders

10-3866: Functions 16, 17, 26, 30, 38 for ASSA ABLOY ACCENTRA® LFIC

10-3870: Functions 70, 71, RX-04, RX-05, RX-15, RX-37

10-3859: All Functions with VSL Trim except 38

10-3933: 38 Function with VSL Trim

10-3934: 38 Function with VSL Trim, Keso Cylinders

10-3935: 38 Function with VSL Trim, ASSA ABLOY ACCENTRA® LFIC

Inside Spring Housing Assemblies (2-1/4" Door)
10-3871: Functions 04, 05, 13, 14, 15, 15-3, 24, 37, 44, 50, 53, 54, 60, 64, 65, 68

10-3872: Functions 16, 17, 26, 30, 38

10-3873: Functions 16, 17, 26, 30, 38 for Keso Cylinders

10-3866: Functions 16, 17, 26, 30, 38 for ASSA ABLOY ACCENTRA® LFIC

10-3875: Functions 70, 71, RX-04, RX-05, RX-15, RX-37

10-3871: All Functions with VSL Trim Except 38

10-3936: 38 Function with VSL Trim

10-3937: 38 Function with VSL Trim, Keso Cylinders

10-3938: 38 Function with VSL Trim, ASSA ABLOY ACCENTRA® LFIC

Dummy Spring Housing Assemblies
10-3868: Outside 93, 94, 94-2

10-3869: Inside 94, 94-2

Roses
10-1202*: G Rose/Scalp (Function: All)

10-1203*: G Rose/Scalp (Function: Inside 16, 38)

10-1200*: L Rose/Scalp (Function: All)

10-1201*: L Rose/Scalp (Function: Inside 16, 38)

10-1260*: Blank Rose/Plate (Function: 07, 08, 15-3)

10-1387*: Rose/Scalp (for use with VSL trim only) (Function: All)

Mounting Plates
10-1071: Outside Support/Mounting Plate 1-3/8" - 2" Door

10-1276: Outside Support/Mounting Plate 2-1/4" Door

10-3656: Outside Mounting Plate Assembly Functions 15-3, 07, 08

Screw Packs - Complete
10-1224*: Standard (with 808 ANSI 4-7/8" strike screws)

10-1225*: 93 Function

10-1250*: 29- Option (with 800 T-strike screws)

10-1226*: 36- Option, 6-Lobe Security Head Torx® (with ANSI & T-strike screws)

10-1227*: 37- Option, Spanner Head (with ANSI & T-strike screws)

10-3761*: BHW Trim, 6-Lobe Security Head Torx® (with mounting, latch and strike screws)

Miscellaneous
10-3188: 1-3/8" Door Adapter Plate Pack (1- option)

10-3667*: Dummy/Blank Front Pack (94-2)

10-0043: Push Pin Tool

10-1587: Emergency Release Key - Privacy/Bathroom Function (66)

10-1504: Plastic door prep tool (through-bolts at 12 & 6 o'clock with 2-3/4" center to center)

14-0057: Emergency Release Key - Privacy/Bathroom Function (65)

Miscellaneous (for VSL Trim only)
10-2967: Button Arm Assembly , All Functions with Inside Indicator Except 38

10-1285: Shank Insert 1-3/8" - 1-3/4" Door, All Functions Except 38

10-1286: Shank Insert 2" Door, All Functions Except 38

10-1474: Shank Insert 2-1/4" Door, All Functions Except 38

01-1745: Outside Mounting Plate Screw #8-32 x 3/8" PFHUTS

Note: Items marked with (*) require you to specify the finish.*

Plain/Unguarded Latch (Functions: 10XU15, 10XU65, 10XU68)
10-3187: Square Corner Front, 1" (25mm) Width, 2-3/8" (60mm) Backset, 1/2" (13mm) Throw

10-2022: Square Corner Front, 1-1/8" (29mm) Width, 2-3/4" (70mm) Backset, 1/2" (13mm) Throw

10-2054: Square Corner Front, 1-1/8" (29mm) Width, 3-3/4" (95mm) Backset, 1/2" (13mm) Throw

10-2057: Square Corner Front, 1-1/8" (29mm) Width, 5" (127mm) Backset, 1/2" (13mm) Throw

Deadlocking/Guarded Latch (All Other Mechanical Functions)
10-3186: Square Corner Front, 1" (25mm) Width, 2-3/8" (60mm) Backset, 1/2" (13mm) Throw

10-3192: Square Corner Front, 1-1/8" (29mm) Width, 2-3/4" (70mm) Backset, 1/2" (13mm) Throw

10-2053: Square Corner Front, 1-1/8" (29mm) Width, 3-3/4" (95mm) Backset, 1/2" (13mm) Throw

10-2058: Square Corner Front, 1-1/8" (29mm) Width, 5" (127mm) Backset, 1/2" (13mm) Throw

10-2634*: Square Corner Front, 1-1/8" (29mm) Width, 2-3/4" (70mm) Backset, 3/4" (19mm) Throw

Note: Part 10-2634 is available in 04/26D finish only.

Deadlocking/Guarded Latch (Electrified Functions)
10-3433: Square Corner Front, 1" (25mm) Width, 2-3/8" (60mm) Backset, 1/2" (13mm) Throw

10-3430: Square Corner Front, 1-1/8" (29mm) Width, 2-3/4" (70mm) Backset, 1/2" (13mm) Throw

10-3431: Square Corner Front, 1-1/8" (29mm) Width, 3-3/4" (95mm) Backset, 1/2" (13mm) Throw

10-3432: Square Corner Front, 1-1/8" (29mm) Width, 5" (127mm) Backset, 1/2" (13mm) Throw

Strikes
4-7/8" Curved Lip Strike (Standard)

Usage: Used with ANSI 4-7/8" (124mm) strike (#808)

Material: Brass, bronze, or stainless steel

Standard: Conforms to ANSI standard

Dimensions: Furnished standard with curved lip 1-1/4" (32mm) from center of strike screw holes to end of lip

Available Lip Lengths:

7/8" (22mm)

1-1/8" (29mm)

1-1/4" (32mm)

1-3/8" (35mm)

1-5/8" (42mm)

1-7/8" (48mm)

2-1/8" (54mm)

2-3/8" (60mm)

2-5/8" (66mm)

2-7/8" (73mm)

3" (76mm)

Ordering: To order strike separately, specify 808 strike x finish x lip length

Wrought Strike Box: 77-1141 available separately

Screw Pack: Must be ordered separately (see "Screw Packs - Complete" section)

2-3/4" Curved Lip Strike (29- Option)

Material: Brass, bronze, or stainless steel

Standard: Furnished standard with 1-1/4" (32mm) curved lip from center of strike screw holes to end of lip

Available Lip Lengths:

1" (25mm)

1-1/4" (32mm) standard

1-1/2" (38mm)

1-3/4" (44mm)

2" (51mm)

3" (76mm)

Included Accessory: Plastic strike box AM-0044 included when 29- ordered with lockset

Ordering: To order strike separately, specify 800 strike x finish x lip length

ANSI Wrought Strike Box

Part No.: 77-1141

Description: 4-7/8" ANSI strike box

Usage: Used with ANSI 4-7/8" (124mm) strike (#808)

Ordering with Lock: Specify option WBS

Ordering Separately: Specify 77-1141

SARGENT Exit Device Generation Guide
Core Identification Note
PE Prefix: This designates the Premium Exit (New Generation) series.

80 Series: This designates the Standard Generation.

Compatibility Rule: If a specific chassis part number is not listed for a PE80 Series device, it is safe to assume it utilizes the same chassis as the standard 80 Series equivalent.

1. 80 Series (Standard Generation)
8300 (Narrow Stile Mortise)

LHRB Chassis: 1-3/4" Door = 68-2481 | 2" to 2-3/4" Door = 68-2483.

RHRB Chassis: 1-3/4" Door = 68-2482 | 2" to 2-3/4" Door = 68-2484.

Chassis Cover: 68-0496-FINISH.

8400 (Narrow Stile Vertical Rod)

Standard Chassis: 68-5944 (Left) | 68-5945 (Right).

Inner Chassis: 94-2008 (Standard) | 68-3854 (53- Prefix).

8500 (Mortise)

Standard Chassis: 68-5880.

Chassis Cover: 68-0495-FINISH.

8600 (Concealed Vertical Rod)

Standard Chassis: 68-5068 (Left) | 68-5069 (Right).

Inner Chassis: 94-2008 (MD/AD) | 68-3580 (WD).

8700 (Surface Vertical Rod)

Standard Functions (Excl. 10, 28, 40, 62, 63): 68-2201 (Left) | 68-2202 (Right).

Chassis Cover: 68-0405-FINISH.

8800 (Rim)

Standard Functions (Excl. 16, 28, 63, 66): 68-4263.

Chassis Cover: 68-0406-FINISH.

2. PE80 Series (Premium Exit New Generation)
PE8300 (Narrow Stile Mortise)

Chassis: Uses standard 80 series chassis (68-2481/68-2482 etc.).

New Gen Chassis Cover: PE-0140-FINISH.

PE8400 (Narrow Stile Vertical Rod)

Inner Chassis: PE-2657 (Standard) | PE-2659 (12-) | PE-2661 (53-).

New Gen Chassis Cover: PE-0140-FINISH.

PE8500 (Mortise)

New Gen Chassis Cover: PE-0139-FINISH.

59 Prefix (New Gen): PE-2325.

PE8600 (Concealed Vertical Rod)

Inner Chassis: PE-2657 (MD/AD) | PE-2028 (WD-Right).

New Gen Chassis Cover: PE-0146-FINISH.

PE8700 (Surface Vertical Rod)

New Gen Chassis Cover: PE-0144-FINISH.

59 Prefix (New Gen): PE-2334 (Left) | PE-2335 (Right).

PE8800 (Rim)

New Gen Chassis Cover: PE-0145-FINISH.

Double Cylinder (16/66 Function): PE-0147-FINISH (Left) | PE-0148-FINISH (Right).

59 Prefix (New Gen): PE-2321.

PE8900 (Mortise)

New Gen Chassis Cover: PE-0146-FINISH.

16/66 Function Cover: PE-0149-FINISH (Left) | PE-0150-FINISH (Right).

Inside and Outside trim kits for mortise locks DO NOT come with "Mounting bridges" or "Return springs". Trim kits only come with the lever, rose/escutcheon, spindles, screws, and thumbturn (if applicable). NEVER mention mounting bridges or return springs when discussing trim kits. You also DONT need to mention that the inside trim kit doesnt include these -- just dont talk about it at all

607-1 Kit
Function: Converts a Storeroom (706) trim to a Classroom (713) trim.

Action: Changes the trim from a "key temporarily unlocks lever" setup to a "key locks and unlocks lever" setup.

Compatibility: Applicable to 700, 700-4, and 700-8 Series trims.

607-2 Kit
Function: Converts a Classroom (713) trim to a Storeroom (706) trim.

Action: Reverts the trim from a "key locks and unlocks lever" setup back to a "key temporarily unlocks lever" setup.

Compatibility: Applicable to 700, 700-4, and 700-8 Series trims.

607-3 Kit
Function: Converts a Freewheeling Storeroom (746) trim to a Freewheeling Classroom (743) trim.

Action: Changes the function while maintaining the freewheeling feature (where the lever moves freely when locked to prevent vandalism).

Compatibility: Applicable to 740, 740-4, and 740-8 Series trims.

607-4 Kit
Function: Converts a Freewheeling Classroom (743) trim to a Freewheeling Storeroom (746) trim.

Action: Reverts the function while maintaining the freewheeling feature.

Compatibility: Applicable to 740, 740-4, and 740-8 Series trims.

607-5 Kit
Function: Converts between Freewheeling Classroom (743-6) and Freewheeling Storeroom (746-6) functions.

Specific Use: This kit is designed specifically for Mortise Exit Devices (specifically the 8900/PE8900 series).

Compatibility: Used for specific trim types like Pull/Escutcheon on Mortise Exit Devices.

### SARGENT MORTISE TRIM & PART NUMBER RULES (DUAL PATH STRATEGY)

1. **Step 1: Identify & Provide Specific Component:**
   - When a user asks for a specific trim component (e.g., "escutcheon," "rose," "thumbturn," "lever") for a Mortise lock (7800/8200/9200 Series):
   - **Action:** First, determine the exact function to ensure the part matches (e.g., an 8225 Escutcheon needs a thumbturn hole; an 8204 does not).
   - **Look Up:** Find the specific part number in the Price Book/Catalog and provide it.
   - *Example:* "For the 8225 LE1L, the Inside Escutcheon is **81-0557** and the Outside Escutcheon is **81-4645**."

2. **Step 2: MANDATORY Kit Recommendation (IS/OS):**
   - **Rule:** IMMEDIATELY after providing the specific part number, you **MUST** recommend the **Inside Working Trim Set (IS)** and **Outside Working Trim Set (OS)**.
   - **Reasoning:** Explicitly explain that ordering a specific part (like an escutcheon) excludes critical hardware like the correct spindles, screws, and (if applicable) thumbturns needed for that specific function. DO NOT mention mounting bridges or return springs, as those are part of the lockbody, not the trim.

3. **Critical Hand & Finish Logic (IS/OS):**
   - **IF User Specified:** Use their exact details. (e.g., if user said "RH 26D", output: "IS-8205 LNL x RH x 26D").
   - **IF NOT Specified:** You **MUST** use the explicit placeholders "[Hand]" and "[Finish]" to alert the user these are required.
   - **Output Format:**
     > "The specific part number is [Part #].
     > **HOWEVER, for accuracy**, I strongly recommend ordering the complete trim sets to ensure you receive the correct spindles and hardware for this function:
     > * **Inside Kit:** IS-[Function] x [Rose] x [Lever] x [Hand] x [Finish]
     > * **Outside Kit:** OS-[Function] x [Rose] x [Lever] x [Hand] x [Finish]"

### SARGENT BORED LOCK (CYLINDRICAL) RULES

1.  **Identify the Series:**
    * **10X Line:** Premium Grade 1 Heavy Duty (The current flagship bored lock).
    * **11 Line (T-Zone):** Grade 1 Heavy Duty (Previous flagship, still common).
    * **10 Line:** Discontinued (Replaced by 10X, but parts still requested).
    * **7 Line:** Grade 2 Standard Duty.
    * **6 Line:** Standard Duty (Light commercial/Residential).
    * **DL Series:** Tubular/Bored Lever lock.
    * **6500 Line:** Grade 2.

2.  **Visual & Terminology Triggers:**
    * **"Cross Bore" / "2-1/8 Hole":** Always indicates a Bored Lock.
    * **"Latch" vs. "Lockbody":** Bored locks use a "latch" (cylindrical tube). Mortise locks use a "lockbody" (large rectangular box)., Bored lock internal parts would also be reffered to as the "lockbody"
    * **"Chassis":** Refers to the External mechanicsm the exit devices use like 8800 chassis or 8700 chassis. theres also inner chassis for concealed vertical rods.
    * **"Rose":** Bored locks almost always have a circular rose (L, G, etc.) against the door. (Mortise locks often use roses as well but can also use escutcheons).

3.  **Critical Bored Lock Prefixes (Ordering Options):**
    * **Backset Prefixes (Standard is 2-3/4" - No Prefix):**
        * "20-": **2-3/8" Backset** (Common for residential or older replacements).
        * "23-": **3-3/4" Backset**.
        * "25-": **5" Backset**.
    * **Strike Prefixes (Check Standards):**
        * "28-": **ANSI 4-7/8" Strike** (#808) – (Note: Check specific line defaults; 10X usually includes ANSI, while 6/7/6500 might default to T-Strike).
        * "29-": **T-Strike** (2-3/4" x 1-1/8") – (Often standard on residential/Grade 2).
        * "41-": **3/4" Throw Latch** (Critical for Fire Rated Pairs of Doors).
    * **Cylinder/Core Prefixes:**
        * "10-": Sargent Signature Key System.
        * "11-": Sargent XC Key System.
        * "21-": Lost Ball Construction Keying.
        * "60-": LFIC Disposable Core.
        * "63-": LFIC (Large Format Interchangeable Core).
        * "70-": SFIC Disposable Core.
        * "72-": SFIC (Small Format Interchangeable Core) Construction.
        * "73-": SFIC 6-Pin Core.
    * **Security/Safety:**
        * "RX-": **Request to Exit** (Switch inside the lock).
        * "36-": Six Lobe Security Screws (Torx).
        * "37-": Spanner Head Screws (Snake Eyes).
        * "74-": Lead Lined (Radiation protection).
        * "75-" / "76-" / "77-": Tactile Warnings (Knurled/Milled levers for accessibility).

4.  **Formatting the Order String:**
    * **Format:** "[Option Prefixes]-[Series][Function] [Design/Trim] x [Finish] x [Hand] [Backset/Strike if non-std]"
    * **Example:** "28-10XG05 L x 26D" (10X Series, Function 05, L Rose, 26D Finish, with ANSI Strike).
    * **Example (Fire Rated Pair):** "41-11G05 L x 26D" (11 Line, 3/4" Throw Latch for pairs).

5.  **Bored Lock "Parts" Rule:**
    * If a user asks for a "Trim kit" for a bored lock, clarify if they mean **Levers** or the **Chassis**.
    * Bored locks generally do *not* use the "IS/OS Working Trim" part numbers (like Mortise). They are sold as:
        * **Lockset:** (Complete lock)
        * **Inside/Outside Housing:** (Spring assembly + Lever)
        * **Latch:** (The bolt mechanism)
        * ## 10X Line Tailpieces & Levers (Reference)
**Levers:**
- Standard: B, L, P (Solid Cast Zinc)
- Decorative: MB, MD, MW, ND
- Specialty: BHW (Behavioral Health), VSLL (Visual Status Indicator)

**Tailpiece Part Numbers (Prefix 10-):**
* **Fixed Core (Standard Cylinders):**
    * Conventional, Signature, XC: **10-3629** (1-3/8" - 2" Door) | **10-3630** (2-1/4" Door)
    * Keso: **10-3637** (Standard) | **10-3638** (Thick)
    * Electrified (Conv/Sig/XC): **10-3791** (Standard) | **10-3792** (Thick)
    * Electrified (Keso): **10-3793** (Standard) | **10-3794** (Thick)

* **LFIC (Large Format Interchangeable Core):**
    * Sargent LFIC (Conv/Sig): **10-3631** (Standard) | **10-3632** (Thick)
    * Sargent XC LFIC: **10-3635** (Standard) | **10-3636** (Thick)
    * Electrified LFIC (Conv/Sig): **10-3773** (Standard) | **10-3774** (Thick)
    * Electrified XC LFIC: **10-3777** (Standard) | **10-3778** (Thick)

* **SFIC (Small Format Interchangeable Core):**
    * 6 or 7 Pin (Mechanical): **10-3633** (Standard) | **10-3634** (Thick)
    * XC SFIC (Mechanical): **10-3641** (Standard) | **10-3642** (Thick)
    * 6 or 7 Pin (Electrified): **10-3775** (Standard) | **10-3776** (Thick)
    * XC SFIC (Electrified): **10-3779** (Standard) | **10-3780** (Thick)

* **Competitor Cylinders (Fixed Core):**
    * Schlage 6-Pin: **10-3625** (Standard) | **10-3626** (Thick)
    * Schlage 6-Pin (Electrified): **10-3781** (Standard) | **10-3782** (Thick)
    * Accentra/Yale 6-Pin: **10-3639** (Standard) | **10-3640** (Thick)
    * Accentra/Yale 7-Pin: **10-3664** (Standard) | **10-3665** (Thick)

* **Competitor Cylinders (LFIC):**
    * Schlage LFIC: **10-3627** (Standard) | **10-3628** (Thick)
    * Schlage LFIC (Electrified): **10-3789** (Standard) | **10-3790** (Thick)
    * Accentra/Yale LFIC: **10-1191** (Standard) | **10-1192** (Thick)
    * Accentra/Yale LFIC (Electrified): **10-3787** (Standard) | **10-3788** (Thick)

## 10X Line Lever Part Numbers (Reference)
**Standard Levers (Solid Cast Zinc): B, L, P**
* **B Design (Standard):**
    * Passage/Plain: **10-1121**
    * Push/Turn Button / Emergency (65) / Sargent Fixed Core 6-Pin: **10-1120**
    * Fixed Core (Competitor - Schlage/Corbin/Accentra): **10-1122**
    * LFIC (Sargent 60-/63-/64-): **10-1123**
    * LFIC (Schlage "SF-" Prefix): **10-1125**
    * SFIC (70-/72-/73-): **10-1124**
    * KESO: **10-1126**
    * Thumbturn (68 Function): **10-2424**
* **B Design (Milled - Tactile):**
    * Passage/Plain: **10-1146**
    * Push/Turn Button / Emergency (65) / Sargent Fixed Core 6-Pin: **10-1145**
    * Fixed Core (Competitor): **10-1147**
    * LFIC (Sargent): **10-1148**
    * LFIC (Schlage "SF-" Prefix): **10-1150**
    * SFIC: **10-1149**
    * KESO: **10-1151**

* **L Design (Standard):**
    * Passage/Plain: **10-1128**
    * Push/Turn Button / Emergency (65) / Sargent Fixed Core 6-Pin: **10-1127**
    * Fixed Core (Competitor - Schlage/Corbin/Accentra): **10-1129**
    * LFIC (Sargent 60-/63-/64-): **10-1130**
    * LFIC (Schlage "SF-" Prefix): **10-1132**
    * LFIC (Accentra "YRC-" Prefix): **10-1134**
    * SFIC (70-/72-/73-): **10-1131**
    * KESO: **10-1133**
    * Thumbturn (68 Function): **10-2425**
* **L Design (Milled - Tactile):**
    * Passage/Plain: **10-1153**
    * Push/Turn Button / Emergency (65) / Sargent Fixed Core 6-Pin: **10-1152**
    * Fixed Core (Competitor): **10-1154**
    * LFIC (Sargent): **10-1155**
    * LFIC (Schlage "SF-" Prefix): **10-1157**
    * LFIC (Accentra "YRC-" Prefix): **10-1159**
    * SFIC: **10-1156**
    * KESO: **10-1158**

* **P Design (Standard):**
    * Passage/Plain: **10-1137**
    * Push/Turn Button / Emergency (65) / Sargent Fixed Core 6-Pin: **10-1136**
    * Fixed Core (Competitor - Schlage/Corbin/Accentra): **10-1138**
    * LFIC (Sargent 60-/63-/64-): **10-1139**
    * LFIC (Schlage "SF-" Prefix): **10-1141**
    * LFIC (Accentra "YRC-" Prefix): **10-1143**
    * SFIC (70-/72-/73-): **10-1140**
    * KESO: **10-1142**
    * Thumbturn (68 Function): **10-2427**
* **P Design (Milled - Tactile):**
    * Passage/Plain: **10-1162**
    * Push/Turn Button / Emergency (65) / Sargent Fixed Core 6-Pin: **10-1161**
    * Fixed Core (Competitor): **10-1163**
    * LFIC (Sargent): **10-1164**
    * LFIC (Schlage "SF-" Prefix): **10-1166**
    * LFIC (Accentra "YRC-" Prefix): **10-1168**
    * SFIC: **10-1165**
    * KESO: **10-1167**

**Decorative Levers: MB, MD, MW, ND**
* **MB (Aventura):** Plain: **10-1263** | Push/Turn/Sargent Fixed Core: **10-1264** | Competitor Fixed Core: **10-1265** | LFIC: **10-1266** | SFIC: **10-1267** | Thumbturn (68): **10-2428**
* **MD (Centro):** Plain: **10-1240** | Push/Turn/Sargent Fixed Core: **10-1241** | Competitor Fixed Core: **10-1242** | LFIC: **10-1243** | SFIC: **10-1244** | Thumbturn (68): **10-2429**
* **MW (Aventura):** Plain: **10-1268** | Push/Turn/Sargent Fixed Core: **10-1269** | Competitor Fixed Core: **10-1270** | LFIC: **10-1271** | SFIC: **10-1272** | Thumbturn (68): **10-2431**
* **ND (Centro):** Plain: **10-1245** | Push/Turn/Sargent Fixed Core: **10-1246** | Competitor Fixed Core: **10-1247** | LFIC: **10-1248** | SFIC: **10-1249** | Thumbturn (68): **10-2432**

**Visual Status Indicators (VSLL)**
* **Red/Green (VSLL-GRN):**
    * Passage/Plain: **10-3834** (Inside) | **10-3819** (Outside)
    * Push/Turn/Sargent Fixed Core: **10-3835** (Inside) | **10-2440** (Outside) | **10-3880** (Inside 38 Function)
    * Emergency Key Hole: **10-3838** (Outside)
    * Competitor Fixed Core: **10-3823** (Outside) | **10-3884** (Inside 38 Function)
    * LFIC (Sargent): **10-3820** (Outside) | **10-3881** (Inside 38 Function)
    * LFIC (Schlage "SF- or SF" Prefix): **10-3824** (Outside) | **10-3885** (Inside 38 Function)
    * LFIC (Accentra "YRC-" Prefix): **10-3825** (Outside) | **10-3886** (Inside 38 Function)
    * SFIC: **10-3821** (Outside) | **10-3882** (Inside 38 Function)
    * KESO: **10-3822** (Outside) | **10-3883** (Inside 38 Function)

* **Red/White (VSLL-WHT):**
    * Passage/Plain: **10-3836** (Inside) | **10-3826** (Outside)
    * Push/Turn/Sargent Fixed Core: **10-3837** (Inside) | **10-3827** (Outside) | **10-3888** (Inside 38 Function)
    * Emergency Key Hole: **10-3839** (Outside)
    * Competitor Fixed Core: **10-3831** (Outside) | **10-3892** (Inside 38 Function)
    * LFIC (Sargent): **10-3828** (Outside) | **10-3889** (Inside 38 Function)
    * LFIC (Schlage "SF-" Prefix): **10-3832** (Outside) | **10-3893** (Inside 38 Function)
    * LFIC (Accentra "YRC-" Prefix): **10-3833** (Outside) | **10-3894** (Inside 38 Function)
    * SFIC: **10-3829** (Outside) | **10-3890** (Inside 38 Function)
    * KESO: **10-3830** (Outside) | **10-3891** (Inside 38 Function)

## Mortise & Exit Device Lever Part Numbers (Reference)
**Standard Levers (Cast Zinc)**
* **A Design (Handed):**
    * Mortise Inside: **81-0467** (LH) | **81-0468** (RH)
    * Mortise Outside: **82-0152** (LH) | **82-0151** (RH)
    * Exit Device: **82-0152** (LH) | **82-0151** (RH)
* **B Design:**
    * Mortise Inside: **81-0490**
    * Mortise Outside: **82-0153**
    * Exit Device: **82-0153**
* **E Design:**
    * Mortise Inside: **81-0470**
    * Mortise Outside: **82-0154**
    * Exit Device: **82-0154**
* **F Design:**
    * Mortise Inside: **81-0471**
    * Mortise Outside: **82-0155**
    * Exit Device: **82-0155**
* **J Design:**
    * Mortise Inside: **81-0447**
    * Mortise Outside: **82-0156**
    * Exit Device: **97-0486**
* **L Design:**
    * Mortise Inside: **81-0489**
    * Mortise Outside: **82-0157**
    * Exit Device: **97-0485**
* **P Design:**
    * Mortise Inside: **81-0513**
    * Mortise Outside: **82-0158**
    * Exit Device: **97-0484**
* **W Design:**
    * Mortise Inside: **81-0445**
    * Mortise Outside: **82-0159**
    * Exit Device: **82-0159**

**Coastal Series**
* **G - Gulfport (Handed):**
    * Mortise Inside: **82-0524** (LH) | **82-0525** (RH)
    * Mortise Outside: **82-0526** (LH) | **82-0527** (RH)
    * Exit Device: **82-0526** (LH) | **82-0527** (RH)
* **R - Rockport:**
    * Mortise Inside: **82-0516**
    * Mortise Outside: **82-0517**
    * Exit Device: **82-0517**
* **S - Sanibel (Handed):**
    * Mortise Inside: **82-0520** (LH) | **82-0521** (RH)
    * Mortise Outside: **82-0522** (LH) | **82-0523** (RH)
    * Exit Device: **82-0522** (LH) | **82-0523** (RH)
* **Y - Yarmouth (Handed):**
    * Mortise Inside: **83-0528** (LH) | **82-0529** (RH)
    * Mortise Outside: **82-0530** (LH) | **82-0531** (RH)
    * Exit Device: **82-0530** (LH) | **82-0531** (RH)

**Centro Series**
* **MD Design:**
    * Mortise Inside: **82-0811**
    * Mortise Outside: **82-0812**
    * Exit Device: **82-0810**
* **MJ Design:**
    * Mortise Inside: **82-0832**
    * Mortise Outside: **82-0833**
    * Exit Device: **82-0831**
* **MP Design:**
    * Mortise Inside: **82-0862**
    * Mortise Outside: **82-0863**
    * Exit Device: **82-0861**
* **ND Design:**
    * Mortise Inside: **82-0908**
    * Mortise Outside: **82-0909**
    * Exit Device: **82-0907**
* **NJ Design:**
    * Mortise Inside: **82-0914**
    * Mortise Outside: **82-0915**
    * Exit Device: **82-0913**

**Aventura Series**
* **MB Design:**
    * Mortise Inside: **82-0805**
    * Mortise Outside: **82-0806**
    * Exit Device: **82-0804**
* **ME Design:**
    * Mortise Inside: **82-0814**
    * Mortise Outside: **82-0815**
    * Exit Device: **82-0813**
* **MF Design:**
    * Mortise Inside: **82-0817**
    * Mortise Outside: **82-0818**
    * Exit Device: **82-0816**
* **MG Design:**
    * Mortise Inside: **82-0820**
    * Mortise Outside: **82-0821**
    * Exit Device: **82-0819**
* **MI Design:**
    * Mortise Inside: **82-0829**
    * Mortise Outside: **82-0830**
    * Exit Device: **82-0828**
* **MW Design:**
    * Mortise Inside: **82-0898**
    * Mortise Outside: **82-0899**
    * Exit Device: **82-0897**
* **NF Design:**
    * Mortise Inside: **82-1276**
    * Mortise Outside: **82-1277**
    * Exit Device: **82-1275**

**Notting Hill Series**
* **MA Design:**
    * Mortise Inside: **82-0802**
    * Mortise Outside: **82-0803**
    * Exit Device: **82-0801**
* **MQ Design (Handed):**
    * Mortise Inside: **82-0868** (LH) | **82-0865** (RH)
    * Mortise Outside: **82-0869** (LH) | **82-0866** (RH)
    * Exit Device: **82-0867** (LH) | **82-0864** (RH)
* **MT Design (Handed):**
    * Mortise Inside: **82-0883** (LH) | **82-0880** (RH)
    * Mortise Outside: **82-0884** (LH) | **82-0881** (RH)
    * Exit Device: **82-0882** (LH) | **82-0879** (RH)
* **MO Design:**
    * Mortise Inside: **82-0859**
    * Mortise Outside: **82-0860**
    * Exit Device: **82-0858**
* **MZ Design (Handed):**
    * Mortise Inside: **82-1080** (LH) | **82-1083** (RH)
    * Mortise Outside: **82-1084** (LH) | **82-1081** (RH)
    * Exit Device: **82-1082** (LH) | **82-1079** (RH)
* **GT Design:**
    * Mortise Inside: **81-0936**
    * Mortise Outside: **81-0937**
    * Exit Device: **81-0935**

**Odeon Series (All Handed)**
* **MH Design:**
    * Mortise Inside: **82-0826** (LH) | **82-0823** (RH)
    * Mortise Outside: **82-0827** (LH) | **82-0824** (RH)
    * Exit Device: **82-0825** (LH) | **82-0822** (RH)
* **MN Design:**
    * Mortise Inside: **82-0856** (LH) | **82-0853** (RH)
    * Mortise Outside: **82-0857** (LH) | **82-0854** (RH)
    * Exit Device: **82-0855** (LH) | **82-0852** (RH)
* **MS Design:**
    * Mortise Inside: **82-1241** (LH) | **82-1242** (RH)
    * Mortise Outside: **82-1244** (LH) | **82-1243** (RH)
    * Exit Device: **82-1240** (LH) | **82-1239** (RH)
* **MU Design:**
    * Mortise Inside: **82-1249** (LH) | **82-1250** (RH)
    * Mortise Outside: **82-1252** (LH) | **82-1251** (RH)
    * Exit Device: **82-1248** (LH) | **82-1247** (RH)
* **MV Design:**
    * Mortise Inside: **82-0895** (LH) | **82-0892** (RH)
    * Mortise Outside: **82-0896** (LH) | **82-0893** (RH)
    * Exit Device: **82-0894** (LH) | **82-0891** (RH)
* **NU Design:**
    * Mortise Inside: **82-1065** (LH) | **82-1068** (RH)
    * Mortise Outside: **82-1069** (LH) | **82-1066** (RH)
    * Exit Device: **82-1067** (LH) | **82-1064** (RH)
* **WG Design:**
    * Mortise Inside: **81-1068** (LH) | **81-1060** (RH)
    * Mortise Outside: **81-1069** (LH) | **81-1061** (RH)
    * Exit Device: **81-1067** (LH) | **81-1059** (RH)

**Gramercy Series**
* **RAM Design:** Mortise In: **RW-2009** | Out: **RW-2010** | Exit: **RW-2008**
* **RAS Design:** Mortise In: **RW-2017** | Out: **RW-2018** | Exit: **RW-2016**
* **RAG Design:** Mortise In: **RW-2017** | Out: **RW-2018** | Exit: **RW-2016**
* **RAL Design:** Mortise In: **RW-2021** | Out: **RW-2022** | Exit: **RW-2020**
* **RAW Design:** Mortise In: **RW-2013** | Out: **RW-2014** | Exit: **RW-2012**
* **RCM Design:** Mortise In: **RW-2005** | Out: **RW-2006** | Exit: **RW-2004**
* **REM Design:** Mortise In: **RW-2001** | Out: **RW-2002** | Exit: **RW-2000**
* **RGM Design:** Mortise In: **RW-2025** | Out: **RW-2026** | Exit: **RW-2024**

**Wooster Square Series**
* **H001:** Mortise In: **82-1581** | Out: **82-1582** | Exit: **82-1580**
* **H002:** Mortise In: **82-1584** | Out: **82-1585** | Exit: **82-1583**
* **H003:** Mortise In: **82-1587** | Out: **82-1588** | Exit: **82-1586**
* **H004:** Mortise In: **82-1587** | Out: **82-1588** | Exit: **82-1586**
* **H005:** Mortise In: **82-1590** | Out: **82-1591** | Exit: **82-1589**
* **H006:** Mortise In: **82-1590** | Out: **82-1591** | Exit: **82-1589**
* **H007:** Mortise In: **82-1593** | Out: **82-1594** | Exit: **82-1592**
* **H008 (Handed):**
    * Mortise In: **81-1598** (LH) | **81-1597** (RH)
    * Mortise Out: **82-1600** (LH) | **82-1599** (RH)
    * Exit: **82-1596** (LH) | **82-1595** (RH)
* **H011:** Mortise In: **82-1608** | Out: **82-1609** | Exit: **82-1607**

**Studio Collection**
* **H015:** Mortise In: **82-1951** | Out: **82-1952** | Exit: **82-1950**
* **H016:** Mortise In: **82-1955** | Out: **82-1956** | Exit: **82-1954**
* **H017:** Mortise In: **82-1947** | Out: **82-1948** | Exit: **82-1946**
* **H018:** Mortise In: **81-0861** | Out: **81-0862** | Exit: **81-0860**

### SARGENT CYLINDER & KEYING RULES

1. **Mortise Cylinder Identification (40 Series):**
   - **"Standard" Size:** The default mortise cylinder is **#41** (1-1/8") for 6-pin applications.
   - **7-Pin / Security / Heavy Duty:** If the user mentions 7-pin, Degree, or specific door thicknesses, move up to **#42** (1-1/4").
   - **Part Number Format:** "[Series]-[Size] [Keyway] x [Finish] x [Cam]"
   - **Sizes:** "41" (1-1/8"), "42" (1-1/4"), "43" (1-3/8"), "44" (1-1/2"), "46" (1-3/4").
   - **Cams:** Always verify the cam. Standard is "13-0664" (Open Cam). For Sargent locksets, use "-105" (Short Cam) for inside cylinders on 8200/9200 functions 16 & 92.

2. **Rim Cylinder Identification (34 Series):**
   - **Series:** Always **#34**.
   - **Mounting:** Supplied with break-off screws and backplate.
   - **Orientation:** Horizontal tailpiece is standard.

3. **Interchangeable Core (LFIC & SFIC) Rules:**
   * **LFIC (Large Format - 6300 Series):**
     - **Core Only:** "6300" (Standard), "11-6300" (XC), "DG1-6300" (Degree).
     - **Housing Less Core (Plastic Throwaway):** Use prefix "60-". (e.g., "60-42" or "60-34").
     - **Housing With Construction Core (Brass Keyed):** Use prefix "64-".
   * **SFIC (Small Format - 7300 Series):**
     - **Core Only:** "7300B" (6-Pin), "7P-7300B" (7-Pin).
     - **Housing Less Core (Plastic Throwaway):** Use prefix "70-". (e.g., "70-43" or "70-34").
     - **Housing With Construction Core (Brass Keyed):** Use prefix "72-".

4. **Key Blanks & Cut Keys:**
   - **Standard Key Blank:** "275" (e.g., "275 LA").
   - **SFIC Key Blank:** "6285B" (6-pin), "7285B" (7-pin).
   - **Cut Change Key (Day Key):** "6272CHK" (Standard), "6282BCHK" (SFIC).
   - **Cut Master Key:** "6272MK" (Standard), "6282BMK" (SFIC).
   - **Cut Control Key:** "6272CTL" (LFIC), "6282BCTL" (SFIC).

5. **Security Prefixes (Critical):**
   - **XC Series:** Always add "11-" prefix (e.g., "11-41").
   - **Degree Series:** Always add "DG1-", "DG2-", or "DG3-" prefix.
   - **Signature:** Always add "10-" prefix.
   - **Bump Resistant:** Add "BR-" prefix.

6. **Part Number Examples:**
   - "LFIC Housing 1-1/4 inch Satin Chrome with Plastic Core": "60-42 x 26D"
   - "Standard Rim Cylinder US3": "34 x 03 x Keying Details"
   - "SFIC Core Only 7-Pin "Best" Brand A Keyway": "7P-7300B x 26D x A Keyway"
   - "Degree Level 1 Mortise Cylinder 1-1/8": "DG1-41 x 26D"
   ETL = Escutcheon trim with L Lever (Can be ETND or ETB or ETP etc etc)

   Permanent/Final Core = 63-, 6300, 73-, 7300B
   Construction/Temporary Core = 64-, 6400, 72-, 7200
   Plastic/Disposable Core = 60-, 70-

   When user asks for permanent core, always suggest 63- or 73- series.

## Referrals
- Templates: https://sargent-templates.netlify.app/
- Cylinders: https://sargent-cylinders.netlify.app/`;

    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: {
            text: userMessage || "Identify this Sargent product",
            images: imagesPayload, 
          },
          history: history, 
          answerGenerationSpec: {
            ignoreAdversarialQuery: true,
            ignoreNonAnswerSeekingQuery: true,
            ignoreLowRelevantContent: true,
            includeCitations: false,
            modelSpec: { modelVersion: "gemini-3-flash-preview" },
            promptSpec: {
              preamble: sargentPreamble,
            },
          },
        }),
      });

      // --- SAFE PARSING LOGIC ---
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        console.error("Non-JSON Response received:", textResponse);
        throw new Error("The AI took too long to respond (Netlify 10s timeout). Please try a shorter question.");
      }

      if (!response.ok) throw new Error(data?.error || "Server Error");

      if (data.answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: aiId,
            role: "assistant",
            text: data.answer.answerText || data.answer,
            sources: parseSources(data.answer.citations),
            video: data.answer.video || null,
            feedbackStatus: null,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now() + "-err",
          role: "assistant", 
          text: `⚠️ Error: ${error.message}` 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`chat-widget-container ${isOpen ? "open" : ""}`}
      onPaste={handlePaste}
    >
      {/* --- IMAGE MODAL --- */}
      {viewingImage && (
        <div className="image-modal-overlay" onClick={() => setViewingImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={viewingImage} alt="Enlarged view" />
            <button className="modal-close-btn" onClick={() => setViewingImage(null)}>
              &times;
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <div className="chat-launcher" onClick={toggleChat}>
          <div className="launcher-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              {/* Sparkle / AI star */}
              <path d="M12 2 L13.2 9.5 L20 10 L13.2 10.5 L12 18 L10.8 10.5 L4 10 L10.8 9.5 Z" />
              <circle cx="19" cy="5" r="1.2" opacity="0.6" />
              <circle cx="5.5" cy="18.5" r="0.9" opacity="0.45" />
            </svg>
          </div>
          <span className="launcher-text">AI Support</span>
        </div>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-info">
              <div className="ai-badge">AI BOT</div>
              <div className="header-title">Sargent Support</div>
            </div>
            <button className="close-btn" onClick={toggleChat}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id || Math.random()} className={`message-row ${msg.role}`}>
                <div className="message-bubble">
                  {/* Gallery */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="message-gallery">
                      {msg.images.map((imgSrc, idx) => (
                        <div key={idx} className="gallery-item" onClick={() => setViewingImage(imgSrc)}>
                          <img src={imgSrc} alt={`Upload ${idx + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="message-text">
                    {msg.role === "assistant" ? formatMessageText(msg.text) : msg.text}
                  </div>

                  {msg.video && (
                    <div className="video-card">
                      <div className="video-card-header">
                        <span className="video-tag">PRO TIP</span>
                        <span className="video-title-text">{msg.video.title}</span>
                      </div>
                      <div className="video-frame-container">
                        <iframe src={`https://www.youtube.com/embed/${msg.video.id}`} title={msg.video.title} allowFullScreen />
                      </div>
                    </div>
                  )}

                  {/* --- FEEDBACK LOOP UI --- */}
                  {msg.role === "assistant" && msg.id !== "init-1" && (
                    <div className="feedback-section">
                      {msg.feedbackStatus === null ? (
                        <div className="feedback-buttons">
                           <button 
                            className="thumb-btn up" 
                            onClick={() => handleRateMessage(msg.id, 'up')}
                            title="Helpful"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                          </button>
                          <button 
                            className="thumb-btn down" 
                            onClick={() => handleRateMessage(msg.id, 'down')}
                            title="Not helpful"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                            </svg>
                          </button>
                        </div>
                      ) : msg.feedbackStatus === "down" ? (
                        <div className="feedback-form">
                          <div className="feedback-form-header">
                             <span className="feedback-title">Tell us more</span>
                             <button className="feedback-cancel" onClick={() => cancelFeedback(msg.id)}>✕</button>
                          </div>
                          <textarea 
                            className="feedback-input" 
                            placeholder="What was incorrect or missing?"
                            value={feedbackComments[msg.id] || ""}
                            onChange={(e) => setFeedbackComments({...feedbackComments, [msg.id]: e.target.value})}
                          />
                          <button 
                            className="feedback-submit-btn"
                            onClick={() => submitFeedback(msg.id, 'down', feedbackComments[msg.id])}
                          >
                            Submit Feedback
                          </button>
                        </div>
                      ) : (
                        <div className="feedback-thanks">
                            <span className="feedback-check">✓</span> Thanks for helping us improve!
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.sources?.length > 0 && (
                  <div className="sources-list">
                    {msg.sources.map((src, idx) => (
                      <a key={idx} href={src.uri} target="_blank" rel="noreferrer" className="source-link">
                        <span className="source-badge">{src.type}</span>
                        <span className="source-label">{src.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="message-row assistant">
                <div className="thinking-bubble">
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                  <span className="thinking-text">Sargent Specialist is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            {selectedImages.length > 0 && (
              <div className="preview-strip">
                {selectedImages.map((img) => (
                  <div key={img.id} className="preview-thumb-container">
                    <img src={img.preview} alt="Preview" className="preview-thumb-img" onClick={() => setViewingImage(img.preview)} />
                    <button className="remove-thumb-btn" onClick={() => removeImage(img.id)}>&times;</button>
                  </div>
                ))}
              </div>
            )}

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input type="file" accept="image/*" multiple ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelect} />
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: "none" }} onChange={handleFileSelect} />

              <button type="button" className="action-btn" onClick={() => fileInputRef.current.click()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </button>

              <button type="button" className="action-btn" onClick={() => cameraInputRef.current.click()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedImages.length > 0 ? "Add a message..." : "Ask the AI (Sargent topics only)..."}
                disabled={isLoading}
              />

              <button type="submit" className="send-btn" disabled={isLoading || (!input.trim() && selectedImages.length === 0)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
            <div style={{fontSize: '9px', color: '#666', textAlign: 'center', marginTop: '4px', paddingBottom: '4px'}}>
                AI can make mistakes. Please verify pricing & parts.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;