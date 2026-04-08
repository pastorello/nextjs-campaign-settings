import pageMetaFields from "@/app/lib/config/pageMetaFields";
import isArrayEmpty from "@/app/lib/utils/validators/isArrayEmpty";
import SortableHeader from "../buttons/SortableHeader";
import DeleteButton from "../buttons/DeleteButton";
import ListItem from "@/app/lib/definitions/interfaces/ListItem";
import PageType from "@/app/lib/definitions/types/PageType";
import ModalButton from "../buttons/ModalButton";
import { fetchFilteredPng } from "@/app/lib/data/png/fetchFilteredPng";
import PngMetaField from "@/app/lib/definitions/enums/png/PngMetaField";

export default async function PngList(props: {
  searchParams?: Promise<ListItem>;
}) {
  const fetchedItems = await fetchFilteredPng(props.searchParams ?? {});

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          {isArrayEmpty(fetchedItems) && <p>{"Nessun PNG trovato"}</p>}
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  <SortableHeader
                    label={"Nome"}
                    fieldKey="nome"
                    isFiltrable={false}
                  />
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <SortableHeader
                    label={"Allineamento"}
                    fieldKey={PngMetaField.allineamento}
                  />
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <SortableHeader
                    label={"Dominio"}
                    fieldKey={PngMetaField.dominioAllineamento}
                  />
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <SortableHeader
                    label={"Fazione"}
                    fieldKey={PngMetaField.fazione}
                  />
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <SortableHeader
                    label={"Luogo"}
                    fieldKey={PngMetaField.luogo}
                  />
                </th>
                <th
                  scope="col"
                  className="relative py-5 pl-6 pr-3 justify-center flex"
                >
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {fetchedItems?.map((item) => (
                <tr
                  key={item.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <p>
                        <strong>
                          {pageMetaFields[PngMetaField.nome].getDatum(
                            item.nome
                          )}
                        </strong>
                        <br />
                        {pageMetaFields[PngMetaField.titolo].getDatum(
                          item.titolo
                        )}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {pageMetaFields[PngMetaField.allineamento].getDatum(
                      item.allineamento
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {pageMetaFields[PngMetaField.dominioAllineamento].getDatum(
                      item.dominioallineamento
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {pageMetaFields[PngMetaField.fazione].getDatum(
                      item.fazione
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {pageMetaFields[PngMetaField.luogo].getDatum(item.luogo)}
                  </td>
                  <td className="py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <ModalButton
                        buttonLabel={"Modifica"}
                        modalTitle={"Modifica PNG"}
                        modalContent={"pngform"}
                        componentProps={{ formData: item }}
                      />
                      <DeleteButton
                        pageName={item.nome}
                        pageId={item.id}
                        pageType={PageType.Png}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
