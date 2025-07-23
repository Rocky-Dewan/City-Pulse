import { useState } from "react";
import api from "../api/api";

export default function CreateReport() {
  const [form, setForm] = useState({ title: "", description: "", category: "", latitude: "", longitude: "" });
  const [file, setFile] = useState(null);

  const submit = async () => {
    const data = new FormData();
    for (let key in form) data.append(key, form[key]);
    if (file) data.append("image", file);

    await api.post("/reports", data);
    alert("Report submitted");
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Report</h1>
      <input className="input" placeholder="Title" onChange={e => setForm({ ...form, title: e.target.value })} />
      <textarea className="input mt-2" placeholder="Description" onChange={e => setForm({ ...form, description: e.target.value })}></textarea>
      <input className="input mt-2" placeholder="Category (road, light...)" onChange={e => setForm({ ...form, category: e.target.value })} />
      <input className="input mt-2" placeholder="Latitude" onChange={e => setForm({ ...form, latitude: e.target.value })} />
      <input className="input mt-2" placeholder="Longitude" onChange={e => setForm({ ...form, longitude: e.target.value })} />
      <input className="input mt-2" type="file" onChange={e => setFile(e.target.files[0])} />
      <button className="btn mt-4" onClick={submit}>Submit Report</button>
    </div>
  );
}
