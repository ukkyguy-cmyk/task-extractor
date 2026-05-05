import { useState } from “react”;

const PROJECTS = [
“PUBLIC MENTOR LAB サイト制作”,
“スケートパーク管理システム”,
“Slack自動化（Make+Gemini）”,
“その他”,
];

const STATUS_OPTIONS = [“未着手”, “進行中”, “完了”, “ブロック中”];
const PRIORITY_OPTIONS = [“高”, “中”, “低”];

const STATUS_COLORS = {
“未着手”: “#6b7280”,
“進行中”: “#3b82f6”,
“完了”: “#10b981”,
“ブロック中”: “#ef4444”,
};

const PRIORITY_COLORS = {
“高”: “#ef4444”,
“中”: “#f59e0b”,
“低”: “#6b7280”,
};

function extractTasksFromText(text) {
const lines = text.split(”\n”).filter(l => l.trim());
const tasks = [];
const taskPatterns = [
/^[-・*•]\s+(.+)/,
/^(\d+)[.)]\s+(.+)/,
/^[□✓✗☐]\s*(.+)/,
/^TODO[:：]\s*(.+)/i,
/^タスク[:：]\s*(.+)/,
/^次のステップ[:：]\s*(.+)/,
/残り[:：]\s*(.+)/,
/必要[:：]\s*(.+)/,
/する必要がある[:。]?\s*$/,
];

lines.forEach(line => {
const trimmed = line.trim();
for (const pattern of taskPatterns) {
const m = trimmed.match(pattern);
if (m) {
const taskText = (m[2] || m[1]).trim();
if (taskText.length > 3) {
tasks.push({
id: Date.now() + Math.random(),
name: taskText,
project: “”,
status: “未着手”,
priority: “中”,
memo: “”,
selected: true,
});
}
break;
}
}
});

return tasks;
}

function toCSV(tasks) {
const header = “タスク名,プロジェクト,ステータス,優先度,メモ”;
const rows = tasks
.filter(t => t.selected)
.map(t =>
[t.name, t.project, t.status, t.priority, t.memo]
.map(v => `"${v.replace(/"/g, '""')}"`)
.join(”,”)
);
return [header, …rows].join(”\n”);
}

export default function TaskExtractor() {
const [step, setStep] = useState(1);
const [chatLog, setChatLog] = useState(””);
const [tasks, setTasks] = useState([]);
const [copied, setCopied] = useState(false);
const [editingId, setEditingId] = useState(null);
const [defaultProject, setDefaultProject] = useState(””);

function handleExtract() {
if (!chatLog.trim()) return;
const extracted = extractTasksFromText(chatLog);
const withProject = extracted.map(t => ({ …t, project: defaultProject }));
setTasks(withProject.length > 0 ? withProject : []);
setStep(2);
}

function updateTask(id, field, value) {
setTasks(prev => prev.map(t => t.id === id ? { …t, [field]: value } : t));
}

function removeTask(id) {
setTasks(prev => prev.filter(t => t.id !== id));
}

function addBlankTask() {
setTasks(prev => […prev, {
id: Date.now(),
name: “”,
project: defaultProject,
status: “未着手”,
priority: “中”,
memo: “”,
selected: true,
}]);
}

function handleCopy() {
const csv = toCSV(tasks);
navigator.clipboard.writeText(csv).then(() => {
setCopied(true);
setTimeout(() => setCopied(false), 2500);
});
}

const selectedCount = tasks.filter(t => t.selected).length;

return (
<div style={{
minHeight: “100vh”,
background: “#0a0a0f”,
color: “#e8e4d8”,
fontFamily: “‘Noto Sans JP’, sans-serif”,
padding: “0”,
}}>
{/* Header */}
<div style={{
background: “linear-gradient(135deg, #0a0a0f 0%, #1a1410 100%)”,
borderBottom: “1px solid #2a2218”,
padding: “20px 20px 16px”,
position: “sticky”,
top: 0,
zIndex: 100,
}}>
<div style={{ display: “flex”, alignItems: “center”, gap: “10px”, marginBottom: “4px” }}>
<span style={{ fontSize: “18px” }}>⚡</span>
<span style={{ fontSize: “13px”, fontWeight: “700”, letterSpacing: “0.15em”, color: “#c9a84c” }}>
TASK EXTRACTOR
</span>
</div>
<div style={{ fontSize: “11px”, color: “#5a5040”, letterSpacing: “0.08em” }}>
Claude チャット → Notion タスク変換
</div>

```
    {/* Steps */}
    <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
      {["ログ入力", "タスク編集", "コピー"].map((label, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: "6px",
          opacity: step === i + 1 ? 1 : 0.4,
        }}>
          <div style={{
            width: "20px", height: "20px", borderRadius: "50%",
            background: step === i + 1 ? "#c9a84c" : step > i + 1 ? "#10b981" : "#2a2218",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: "700", color: "#0a0a0f",
          }}>
            {step > i + 1 ? "✓" : i + 1}
          </div>
          <span style={{ fontSize: "11px", color: step === i + 1 ? "#c9a84c" : "#5a5040" }}>
            {label}
          </span>
          {i < 2 && <span style={{ fontSize: "10px", color: "#3a3028" }}>›</span>}
        </div>
      ))}
    </div>
  </div>

  <div style={{ padding: "20px" }}>

    {/* STEP 1 */}
    {step === 1 && (
      <div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "11px", color: "#c9a84c", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
            プロジェクト（デフォルト）
          </label>
          <select
            value={defaultProject}
            onChange={e => setDefaultProject(e.target.value)}
            style={{
              width: "100%", background: "#12100e", border: "1px solid #2a2218",
              color: "#e8e4d8", padding: "10px 12px", borderRadius: "8px",
              fontSize: "13px", appearance: "none",
            }}
          >
            <option value="">未設定</option>
            {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <label style={{ fontSize: "11px", color: "#c9a84c", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
          チャットログを貼り付け
        </label>
        <textarea
          value={chatLog}
          onChange={e => setChatLog(e.target.value)}
          placeholder={"Claudeとの会話をここに貼り付けてください\n\n例：\n- OAuth認証をPCで完了する\n- Make連携シナリオを2つ作成\n残り：Vercel移行を検討する"}
          style={{
            width: "100%", minHeight: "220px", background: "#12100e",
            border: "1px solid #2a2218", borderRadius: "10px",
            color: "#e8e4d8", padding: "14px", fontSize: "13px",
            lineHeight: "1.7", resize: "vertical", boxSizing: "border-box",
            outline: "none", fontFamily: "'Noto Sans JP', sans-serif",
          }}
        />
        <div style={{ fontSize: "11px", color: "#5a5040", marginTop: "6px" }}>
          ✦ リスト（-・*）、番号付き、TODO: で始まる行を自動検出
        </div>

        <button
          onClick={handleExtract}
          disabled={!chatLog.trim()}
          style={{
            width: "100%", marginTop: "16px", padding: "14px",
            background: chatLog.trim() ? "linear-gradient(135deg, #c9a84c, #a07830)" : "#2a2218",
            color: chatLog.trim() ? "#0a0a0f" : "#5a5040",
            border: "none", borderRadius: "10px", fontSize: "14px",
            fontWeight: "700", letterSpacing: "0.08em", cursor: chatLog.trim() ? "pointer" : "default",
            transition: "all 0.2s",
          }}
        >
          タスクを抽出する →
        </button>
      </div>
    )}

    {/* STEP 2 */}
    {step === 2 && (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#c9a84c", fontWeight: "700" }}>
              {tasks.length}件 検出 / {selectedCount}件 選択中
            </div>
            <div style={{ fontSize: "11px", color: "#5a5040", marginTop: "2px" }}>
              タップして編集・チェックで選択
            </div>
          </div>
          <button
            onClick={addBlankTask}
            style={{
              padding: "8px 14px", background: "#1a1810",
              border: "1px solid #c9a84c", borderRadius: "8px",
              color: "#c9a84c", fontSize: "12px", cursor: "pointer",
            }}
          >
            ＋ 追加
          </button>
        </div>

        {tasks.length === 0 && (
          <div style={{
            background: "#12100e", border: "1px dashed #2a2218",
            borderRadius: "10px", padding: "30px", textAlign: "center",
            color: "#5a5040", fontSize: "13px",
          }}>
            タスクが検出されませんでした<br />
            <span style={{ fontSize: "11px" }}>「＋ 追加」で手動入力できます</span>
          </div>
        )}

        {tasks.map(task => (
          <div key={task.id} style={{
            background: task.selected ? "#12100e" : "#0e0c0a",
            border: `1px solid ${task.selected ? "#2a2218" : "#1a1810"}`,
            borderLeft: `3px solid ${task.selected ? "#c9a84c" : "#2a2218"}`,
            borderRadius: "10px", padding: "12px", marginBottom: "10px",
            opacity: task.selected ? 1 : 0.5,
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <input
                type="checkbox"
                checked={task.selected}
                onChange={e => updateTask(task.id, "selected", e.target.checked)}
                style={{ marginTop: "3px", accentColor: "#c9a84c", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === task.id ? (
                  <input
                    autoFocus
                    value={task.name}
                    onChange={e => updateTask(task.id, "name", e.target.value)}
                    onBlur={() => setEditingId(null)}
                    style={{
                      width: "100%", background: "#1a1810", border: "1px solid #c9a84c",
                      borderRadius: "6px", color: "#e8e4d8", padding: "6px 8px",
                      fontSize: "13px", boxSizing: "border-box",
                      fontFamily: "'Noto Sans JP', sans-serif",
                    }}
                  />
                ) : (
                  <div
                    onClick={() => setEditingId(task.id)}
                    style={{ fontSize: "13px", lineHeight: "1.5", cursor: "text", wordBreak: "break-all" }}
                  >
                    {task.name || <span style={{ color: "#5a5040" }}>タスク名をタップして入力</span>}
                  </div>
                )}

                <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                  <select
                    value={task.project}
                    onChange={e => updateTask(task.id, "project", e.target.value)}
                    style={{
                      background: "#1a1810", border: "1px solid #2a2218", borderRadius: "6px",
                      color: "#a09070", padding: "4px 6px", fontSize: "11px", flex: "1",
                      minWidth: "120px",
                    }}
                  >
                    <option value="">プロジェクト未設定</option>
                    {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <select
                    value={task.status}
                    onChange={e => updateTask(task.id, "status", e.target.value)}
                    style={{
                      background: "#1a1810", border: `1px solid ${STATUS_COLORS[task.status]}40`,
                      borderRadius: "6px", color: STATUS_COLORS[task.status],
                      padding: "4px 6px", fontSize: "11px", flex: 1,
                    }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={task.priority}
                    onChange={e => updateTask(task.id, "priority", e.target.value)}
                    style={{
                      background: "#1a1810", border: `1px solid ${PRIORITY_COLORS[task.priority]}40`,
                      borderRadius: "6px", color: PRIORITY_COLORS[task.priority],
                      padding: "4px 6px", fontSize: "11px", flex: 1,
                    }}
                  >
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <input
                  value={task.memo}
                  onChange={e => updateTask(task.id, "memo", e.target.value)}
                  placeholder="メモ（任意）"
                  style={{
                    width: "100%", background: "#1a1810", border: "1px solid #1e1c18",
                    borderRadius: "6px", color: "#7a7060", padding: "5px 8px",
                    fontSize: "11px", marginTop: "6px", boxSizing: "border-box",
                    fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                />
              </div>
              <button
                onClick={() => removeTask(task.id)}
                style={{
                  background: "none", border: "none", color: "#5a5040",
                  cursor: "pointer", fontSize: "16px", flexShrink: 0, padding: "0",
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button
            onClick={() => setStep(1)}
            style={{
              flex: 1, padding: "13px", background: "#1a1810",
              border: "1px solid #2a2218", borderRadius: "10px",
              color: "#a09070", fontSize: "13px", cursor: "pointer",
            }}
          >
            ← 戻る
          </button>
          <button
            onClick={() => setStep(3)}
            disabled={selectedCount === 0}
            style={{
              flex: 2, padding: "13px",
              background: selectedCount > 0 ? "linear-gradient(135deg, #c9a84c, #a07830)" : "#2a2218",
              color: selectedCount > 0 ? "#0a0a0f" : "#5a5040",
              border: "none", borderRadius: "10px", fontSize: "13px",
              fontWeight: "700", cursor: selectedCount > 0 ? "pointer" : "default",
            }}
          >
            {selectedCount}件をエクスポート →
          </button>
        </div>
      </div>
    )}

    {/* STEP 3 */}
    {step === 3 && (
      <div>
        <div style={{
          background: "#12100e", border: "1px solid #2a2218",
          borderRadius: "10px", padding: "16px", marginBottom: "16px",
        }}>
          <div style={{ fontSize: "11px", color: "#c9a84c", letterSpacing: "0.1em", marginBottom: "10px" }}>
            CSV プレビュー（{selectedCount}件）
          </div>
          <pre style={{
            fontSize: "10px", color: "#6a6050", lineHeight: "1.8",
            overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
            maxHeight: "200px", margin: 0,
          }}>
            {toCSV(tasks)}
          </pre>
        </div>

        <button
          onClick={handleCopy}
          style={{
            width: "100%", padding: "16px",
            background: copied
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #c9a84c, #a07830)",
            color: "#0a0a0f", border: "none", borderRadius: "10px",
            fontSize: "15px", fontWeight: "700", cursor: "pointer",
            letterSpacing: "0.08em", transition: "all 0.3s",
          }}
        >
          {copied ? "✓ コピー完了！" : "📋 CSVをコピー"}
        </button>

        <div style={{
          background: "#0e1410", border: "1px solid #1a2818",
          borderRadius: "10px", padding: "14px", marginTop: "16px",
        }}>
          <div style={{ fontSize: "11px", color: "#10b981", fontWeight: "700", marginBottom: "8px" }}>
            Notionへの取り込み手順
          </div>
          {[
            "Notionでタスク管理DBを開く",
            "右上「…」→「CSVをインポート」",
            "コピーしたCSVをテキストファイル(.csv)で保存",
            "ファイルを選択してインポート実行",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
              <span style={{
                background: "#10b981", color: "#0a0a0f", borderRadius: "50%",
                width: "18px", height: "18px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px", fontWeight: "700",
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: "12px", color: "#6a8060", lineHeight: "1.5" }}>{step}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
          <button
            onClick={() => setStep(2)}
            style={{
              flex: 1, padding: "12px", background: "#1a1810",
              border: "1px solid #2a2218", borderRadius: "10px",
              color: "#a09070", fontSize: "13px", cursor: "pointer",
            }}
          >
            ← 編集に戻る
          </button>
          <button
            onClick={() => { setStep(1); setChatLog(""); setTasks([]); }}
            style={{
              flex: 1, padding: "12px", background: "#1a1810",
              border: "1px solid #2a2218", borderRadius: "10px",
              color: "#a09070", fontSize: "13px", cursor: "pointer",
            }}
          >
            最初からやり直す
          </button>
        </div>
      </div>
    )}
  </div>

  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet" />
</div>
```

);
}
