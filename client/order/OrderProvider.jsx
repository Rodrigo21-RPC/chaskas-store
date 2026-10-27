import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { api } from "../api.js";
import { orderReducer } from "./reducer.js";
import { readOrder, writeOrder, storageWarning } from "./storage.js";
import { reconcile } from "./reconcile.js";
const Context = createContext(null);
export const useOrder = () => useContext(Context);
export function OrderProvider({ children }) {
  const storage = useRef(null);
  try {
    storage.current = globalThis.localStorage;
  } catch {
    /* El navegador puede bloquearlo. */
  }
  const [initial] = useState(() => readOrder(storage.current));
  const [items, setItems] = useState(initial.items),
    [notice, setNotice] = useState(initial.warning),
    [busy, setBusy] = useState(false),
    [adding, setAdding] = useState([]),
    [enabled, setEnabled] = useState(false),
    [storeError, setStoreError] = useState("");
  const current = useRef(items),
    revision = useRef(0),
    inFlight = useRef(new Set()),
    checking = useRef(false);
  const refreshStore = useCallback(async () => {
    setStoreError("");
    try {
      const s = await api("/api/store");
      setEnabled(s.whatsappEnabled);
    } catch (e) {
      setEnabled(false);
      setStoreError(e.message);
    }
  }, []);
  useEffect(() => {
    refreshStore();
  }, [refreshStore]);
  const commit = useCallback((next) => {
    current.current = next;
    revision.current++;
    setItems(next);
    if (!writeOrder(storage.current, next)) setNotice(storageWarning);
  }, []);
  const add = useCallback(
    async (p) => {
      if (inFlight.current.has(p.id)) return;
      inFlight.current.add(p.id);
      setAdding([...inFlight.current]);
      try {
        const fresh = await api(`/api/products/${p.id}`);
        const next = orderReducer(current.current, {
          type: "add",
          product: fresh,
        });
        setNotice(`${fresh.name} agregado al pedido.`);
        commit(next);
      } catch (e) {
        setNotice(e.message);
      } finally {
        inFlight.current.delete(p.id);
        setAdding([...inFlight.current]);
      }
    },
    [commit],
  );
  const change = useCallback(
    (id, quantity) => {
      try {
        commit(
          orderReducer(current.current, { type: "quantity", id, quantity }),
        );
      } catch (e) {
        setNotice(e.message);
      }
    },
    [commit],
  );
  const remove = useCallback(
    (id) => commit(orderReducer(current.current, { type: "remove", id })),
    [commit],
  );
  const preview = useCallback(async () => {
    if (checking.current) return null;
    checking.current = true;
    setBusy(true);
    const version = revision.current,
      snapshot = current.current;
    try {
      const response = await api("/api/order/preview", {
        method: "POST",
        body: JSON.stringify({
          items: snapshot.map(({ productId, quantity }) => ({
            productId,
            quantity,
          })),
        }),
      });
      if (revision.current !== version) {
        setNotice(
          "El pedido cambió mientras se verificaba. Revísalo y vuelve a intentarlo.",
        );
        return null;
      }
      const result = reconcile(snapshot, response);
      if (result.notice) setNotice(result.notice);
      if (response.status === "ready") {
        setEnabled(true);
        setStoreError("");
      } else if (response.status === "unavailable") {
        setEnabled(false);
        setStoreError("");
      }
      commit(result.items);
      return response;
    } catch (e) {
      setNotice(e.message);
      return null;
    } finally {
      checking.current = false;
      setBusy(false);
    }
  }, [commit]);
  return (
    <Context.Provider
      value={{
        items,
        count: items.reduce((n, x) => n + x.quantity, 0),
        notice,
        busy,
        adding,
        enabled,
        storeError,
        refreshStore,
        add,
        change,
        remove,
        preview,
      }}
    >
      {children}
    </Context.Provider>
  );
}
